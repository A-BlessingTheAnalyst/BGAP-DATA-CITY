// Optimizes third-party asset packs into web-ready GLBs.
//
//   node scripts/assets/optimize.mjs            all packs whose source folder exists
//   node scripts/assets/optimize.mjs kenney-cars
//
// Reads assets/manifest.json, rejects non-CC0/CC-BY packs, then for each listed model:
// embeds external textures, dedups, welds, prunes, quantizes and meshopt-compresses it.
// Per-pack options in the manifest:
//   textureSize: N        resize textures to N×N and re-encode as WebP (big PBR packs)
//   animationsOnly: true  drop meshes/skins, keep bone nodes + clips (shared animation library)
//   keepClips: [...]      only keep these animation clips
//   bundle: "name"        merge every model into one GLB (shared textures stored once);
//                         each model becomes a node named KIT__<model>
// Output: public/assets/kits/<pack>/<model>.glb, src/features/game/world/kit/generated/kitIndex.json (bounds per
// model, used for colliders and Asset Lab framing) and CREDITS.md.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NodeIO, Logger } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, quantize, reorder, meshopt, getBounds, textureCompress, mergeDocuments, resample, unpartition } from '@gltf-transform/functions';
import sharp from 'sharp';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/manifest.json'), 'utf8'));
const only = new Set(process.argv.slice(2));
const OUT = path.join(ROOT, 'public/assets/kits');

const globToRe = (g) => new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$', 'i');

await MeshoptEncoder.ready;
await MeshoptDecoder.ready;
const io = new NodeIO()
  .setLogger(new Logger(Logger.Verbosity.WARN))
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

const indexPath = path.join(ROOT, 'src/features/game/world/kit/generated/kitIndex.json');
fs.mkdirSync(path.dirname(indexPath), { recursive: true });
const index = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : { packs: {} };
let failed = false;

for (const pack of manifest.packs) {
  if (only.size && !only.has(pack.id)) continue;
  if (!manifest.allowedLicences.includes(pack.licence)) {
    console.error(`✗ ${pack.id}: licence ${pack.licence} is not allowed`);
    failed = true;
    continue;
  }
  const src = path.join(ROOT, pack.source);
  if (!fs.existsSync(src)) {
    console.log(`… ${pack.id}: source not downloaded yet (${pack.source})${pack.optional ? ' — skipped' : ''}`);
    if (!pack.optional) failed = true;
    continue;
  }
  const res = pack.include.map(globToRe);
  if (pack.type === 'files') {
    // Non-model assets (audio, HDRIs): copy as-is and credit.
    const dest = path.join(ROOT, pack.dest);
    fs.mkdirSync(dest, { recursive: true });
    const picked = walk(src).filter((f) => res.some((r) => r.test(path.basename(f))));
    for (const f of picked) if (path.resolve(path.dirname(f)) !== path.resolve(dest)) fs.copyFileSync(f, path.join(dest, path.basename(f)));
    index.files = index.files ?? {};
    index.files[pack.id] = { name: pack.name, author: pack.author, url: pack.url, licence: pack.licence, files: picked.map((f) => '/' + path.relative(path.join(ROOT, 'public'), path.join(dest, path.basename(f))).split(path.sep).join('/')) };
    console.log(`✓ ${pack.id}: ${picked.length} files`);
    continue;
  }
  const files = walk(src).filter((f) => /\.(glb|gltf)$/i.test(f) && res.some((r) => r.test(path.basename(f).replace(/\.(glb|gltf)$/i, ''))));
  const outDir = path.join(OUT, pack.id);
  fs.mkdirSync(outDir, { recursive: true });
  const models = {};
  let bytes = 0;
  const r = (v) => Math.round(v * 1000) / 1000;
  const finish = async (doc) => {
    const root = doc.getRoot();
    if (pack.animationsOnly) {
      root.listMeshes().forEach((m) => m.dispose());
      root.listSkins().forEach((sk) => sk.dispose());
      root.listMaterials().forEach((m) => m.dispose());
      root.listTextures().forEach((t) => t.dispose());
    }
    if (pack.keepClips) {
      const keep = new Set(pack.keepClips);
      root.listAnimations().forEach((a) => { if (!keep.has(a.getName())) a.dispose(); });
    }
    const steps = [unpartition(), dedup(), weld(), resample(), prune({ keepLeaves: !!pack.animationsOnly, keepAttributes: false })];
    if (pack.textureSize) steps.push(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [pack.textureSize, pack.textureSize], quality: 82 }));
    steps.push(reorder({ encoder: MeshoptEncoder }), quantize(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
    await doc.transform(...steps);
  };
  const entry = (doc, url, extra = {}) => {
    const scene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0];
    const b = getBounds(scene);
    return {
      url,
      size: b.max.map((v, i) => r(v - b.min[i])),
      min: b.min.map(r),
      max: b.max.map(r),
      animations: doc.getRoot().listAnimations().map((a) => a.getName()),
      skinned: doc.getRoot().listSkins().length > 0,
      ...extra,
    };
  };
  // Some packs keep textures in a sibling "Textures" folder, sometimes under slightly different
  // names (e.g. "X_png.png" for "X.png"). Index every texture near the pack and resolve by name.
  const texIndex = new Map();
  for (let dir = src, i = 0; i < 4; i++, dir = path.dirname(dir)) {
    if (!fs.existsSync(dir)) continue;
    for (const f of walk(dir)) if (/\.(png|jpe?g|webp)$/i.test(f)) {
      const key = path.basename(f).toLowerCase();
      if (!texIndex.has(key)) texIndex.set(key, f);
    }
  }
  const findTexture = (uri, baseDir) => {
    const direct = path.join(baseDir, decodeURIComponent(uri));
    if (fs.existsSync(direct)) return direct;
    const b = path.basename(decodeURIComponent(uri)).toLowerCase();
    const candidates = [b, b.replace(/_png\.png$/, '.png'), b.replace(/\.png$/, '_basecolor.png')];
    for (const c of candidates) if (texIndex.has(c)) return texIndex.get(c);
    return null;
  };
  const readModel = async (file) => {
    if (/\.glb$/i.test(file)) return io.read(file);
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    const baseDir = path.dirname(file);
    const resources = {};
    for (const b of json.buffers ?? []) if (b.uri && !b.uri.startsWith('data:')) resources[b.uri] = new Uint8Array(fs.readFileSync(path.join(baseDir, decodeURIComponent(b.uri))));
    for (const img of json.images ?? []) {
      if (!img.uri || img.uri.startsWith('data:')) continue;
      const found = findTexture(img.uri, baseDir);
      if (found) resources[img.uri] = new Uint8Array(fs.readFileSync(found));
      else { console.warn(`  ! ${path.basename(file)}: texture ${img.uri} not found, dropped`); delete img.uri; }
    }
    return io.readJSON({ json, resources });
  };
  const nameOf = (f) => path.basename(f).replace(/\.(glb|gltf)$/i, '').replace(/[^a-zA-Z0-9_-]+/g, '-');

  if (pack.bundle) {
    // One GLB for the whole kit: textures shared, each piece addressable by node name.
    const target = await readModel(files[0]);
    const main = target.getRoot().getDefaultScene() ?? target.getRoot().listScenes()[0];
    const wrap = (scene, name) => {
      const holder = target.createNode(`KIT__${name}`);
      scene.listChildren().forEach((c) => { scene.removeChild(c); holder.addChild(c); });
      main.addChild(holder);
    };
    const bundleUrl = `/assets/kits/${pack.id}/${pack.bundle}.glb`;
    models[nameOf(files[0])] = { ...entry(target, bundleUrl), node: `KIT__${nameOf(files[0])}` };
    wrap(main, nameOf(files[0]));
    for (const file of files.slice(1)) {
      const doc = await readModel(file);
      const name = nameOf(file);
      models[name] = { ...entry(doc, bundleUrl), node: `KIT__${name}` };
      const map = mergeDocuments(target, doc);
      const srcScene = doc.getRoot().getDefaultScene() ?? doc.getRoot().listScenes()[0];
      const merged = map.get(srcScene);
      wrap(merged, name);
      merged.dispose();
    }
    await finish(target);
    const glb = await io.writeBinary(target);
    fs.writeFileSync(path.join(outDir, `${pack.bundle}.glb`), glb);
    bytes = glb.byteLength;
  } else {
    for (const file of files) {
      const name = nameOf(file);
      const doc = await readModel(file);
      await finish(doc);
      const glb = await io.writeBinary(doc);
      fs.writeFileSync(path.join(outDir, `${name}.glb`), glb);
      bytes += glb.byteLength;
      models[name] = entry(doc, `/assets/kits/${pack.id}/${name}.glb`);
    }
  }
  index.packs[pack.id] = { name: pack.name, author: pack.author, url: pack.url, licence: pack.licence, models };
  console.log(`✓ ${pack.id}: ${files.length} models, ${(bytes / 1024).toFixed(0)} KB`);
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(indexPath, JSON.stringify(index, null, 1));
writeCredits();
if (failed) process.exit(1);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}

function writeCredits() {
  const lines = [
    '# Credits',
    '',
    'Third-party assets used in Data City. Generated by `scripts/assets/optimize.mjs` from `assets/manifest.json`; do not edit by hand.',
    '',
    '| Pack | Author | Licence | Shipped | Source |',
    '|---|---|---|---|---|',
  ];
  for (const [id, p] of Object.entries(index.packs)) {
    lines.push(`| ${p.name} | ${p.author} | ${p.licence} | ${Object.keys(p.models).length} models | ${p.url} |`);
  }
  for (const [id, p] of Object.entries(index.files ?? {})) {
    lines.push(`| ${p.name} | ${p.author} | ${p.licence} | ${p.files.length} files | ${p.url} |`);
  }
  lines.push('', 'All other models, textures, signage and characters are original to Data City.', '');
  fs.writeFileSync(path.join(ROOT, 'CREDITS.md'), lines.join('\n'));
}
