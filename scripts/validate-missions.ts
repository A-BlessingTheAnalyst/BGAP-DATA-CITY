// Validates every mission package in content/missions (and today's generated gigs).
//   npm run validate:missions
// Checks structure, file presence, CSV headers, findings, and that the hidden fixtures actually
// discriminate: the reference answer passes all of them and a lazy `SELECT *` fails.

import fs from 'node:fs';
import path from 'node:path';
import { CONTENT_ROOT, getMission } from '../src/server/content/missions';
import { generatedGigs } from '../src/server/content/gigs';
import { parseCsv } from '../src/server/content/csv';
import { gradeSql } from '../src/server/assessment/SqlGrader';
import type { MissionDef } from '../src/shared/types/content';

let errors = 0;
const fail = (id: string, msg: string) => { console.log(`  ✗ ${id}: ${msg}`); errors++; };

function checkStructure(def: MissionDef, dir: string | null) {
  const id = def.id;
  const required: (keyof MissionDef)[] = ['id', 'kind', 'tier', 'skill', 'title', 'client', 'summary', 'pay', 'xp', 'passMark', 'location', 'starterSql', 'tables', 'hints', 'findings', 'successFeedback', 'trapFixture', 'fixtures'];
  for (const k of required) if (def[k] === undefined) fail(id, `missing "${k}"`);
  if (![1, 2, 3, 4, 5].includes(def.tier)) fail(id, `tier must be 1–5`);
  if (!(def.pay > 0)) fail(id, 'pay must be positive');
  if (def.hints.length < 2) fail(id, 'needs at least two hints');
  if (!def.client.brief?.length) fail(id, 'client needs at least one brief line');
  if (!def.location.remote && (!def.location.npc || !def.location.workstation)) fail(id, 'in-world missions need npc and workstation positions');
  for (const f of def.findings) {
    const correct = f.options.filter((o) => o.correct).length;
    if (correct !== 1) fail(id, `finding "${f.id}" must have exactly one correct option (has ${correct})`);
    if (new Set(f.options.map((o) => o.id)).size !== f.options.length) fail(id, `finding "${f.id}" has duplicate option ids`);
  }
  const evidenceIds = (def.evidence ?? []).map((e) => e.id);
  if (new Set(evidenceIds).size !== evidenceIds.length) fail(id, 'duplicate evidence ids');
  for (const e of def.evidence ?? []) {
    if (!e.title || !e.text) fail(id, `evidence "${e.id}" needs a title and text`);
    if (!Array.isArray(e.position) || e.position.length !== 3 || !e.position.every(Number.isFinite)) fail(id, `evidence "${e.id}" needs an [x, y, z] position`);
    if (def.location.remote) fail(id, `remote jobs can't have field evidence ("${e.id}")`);
  }
  for (const f of def.findings) if (f.evidence && !evidenceIds.includes(f.evidence)) fail(id, `finding "${f.id}" requires unknown evidence "${f.evidence}"`);
  const fxIds = def.fixtures.map((f) => f.id);
  if (!fxIds.includes(def.trapFixture)) fail(id, `trapFixture "${def.trapFixture}" is not in fixtures`);
  if (fxIds.length < 3) fail(id, 'needs at least three hidden fixtures');
  if (!dir) return;
  if (!fs.existsSync(path.join(dir, 'reference.sql'))) fail(id, 'missing reference.sql');
  for (const t of def.tables) {
    const file = path.join(dir, 'dataset', `${t.name}.csv`);
    if (!fs.existsSync(file)) { fail(id, `missing dataset/${t.name}.csv`); continue; }
    const header = parseCsv(fs.readFileSync(file, 'utf8'))[0];
    const cols = t.columns.map((c) => c.name);
    if (header.join(',') !== cols.join(',')) fail(id, `dataset/${t.name}.csv header [${header}] doesn't match columns [${cols}]`);
  }
  for (const fx of def.fixtures) {
    const fxDir = path.join(dir, 'fixtures', fx.id);
    if (fx.id !== 'sample' && !fs.existsSync(fxDir)) fail(id, `fixture "${fx.id}" has no folder fixtures/${fx.id}/`);
  }
}

async function checkGrading(id: string) {
  const pkg = getMission(id)!;
  const ref = await gradeSql(id, pkg.grading.referenceSql, pkg.grading);
  if (ref.queryError) fail(id, `reference.sql errors: ${ref.queryError}`);
  else if (ref.passRate !== 1) fail(id, 'reference.sql does not pass its own fixtures');
  const lazy = await gradeSql(id, `SELECT * FROM ${pkg.def.tables[0].name}`, pkg.grading);
  if (lazy.passRate === 1) fail(id, '`SELECT *` passes every fixture; the fixtures don’t test anything');
}

async function main() {
  const dirs = fs.readdirSync(CONTENT_ROOT, { withFileTypes: true }).filter((d) => d.isDirectory());
  console.log(`Authored missions (${dirs.length})`);
  for (const d of dirs) {
    const dir = path.join(CONTENT_ROOT, d.name);
    let def: MissionDef;
    try { def = JSON.parse(fs.readFileSync(path.join(dir, 'mission.json'), 'utf8')); } catch (e) { fail(d.name, `mission.json unreadable: ${(e as Error).message}`); continue; }
    if (def.id !== d.name) fail(d.name, `folder name must equal mission id "${def.id}"`);
    const before = errors;
    checkStructure(def, dir);
    await checkGrading(def.id);
    if (errors === before) console.log(`  ✓ ${def.id} (tier ${def.tier}, ₦${def.pay.toLocaleString()}, ${def.fixtures.length} fixtures)`);
  }
  console.log("Today's generated gigs");
  for (const gig of generatedGigs()) {
    const before = errors;
    checkStructure(gig.def, null);
    await checkGrading(gig.def.id);
    if (errors === before) console.log(`  ✓ ${gig.def.id}: ${gig.def.title}`);
  }
  console.log(errors ? `\n${errors} problem(s) found` : '\nAll missions valid');
  process.exit(errors ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
