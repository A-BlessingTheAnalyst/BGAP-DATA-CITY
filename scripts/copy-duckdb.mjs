// Copies the DuckDB-Wasm bundles from node_modules into public/duckdb so the SQL terminal
// works offline and without a CDN (roadmap T24). Runs on postinstall, predev and prebuild.
// public/duckdb is gitignored: it is ~75 MB and always reproducible from the installed package.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const src = path.join(root, 'node_modules', '@duckdb', 'duckdb-wasm', 'dist');
const out = path.join(root, 'public', 'duckdb');
const FILES = ['duckdb-mvp.wasm', 'duckdb-browser-mvp.worker.js', 'duckdb-eh.wasm', 'duckdb-browser-eh.worker.js'];

if (!fs.existsSync(src)) {
  console.warn('[copy-duckdb] @duckdb/duckdb-wasm is not installed; skipping.');
  process.exit(0);
}
fs.mkdirSync(out, { recursive: true });
let copied = 0;
for (const f of FILES) {
  const from = path.join(src, f), to = path.join(out, f);
  if (!fs.existsSync(from)) { console.error(`[copy-duckdb] missing ${from}`); process.exit(1); }
  const a = fs.statSync(from);
  if (fs.existsSync(to) && fs.statSync(to).size === a.size && fs.statSync(to).mtimeMs >= a.mtimeMs) continue;
  fs.copyFileSync(from, to);
  copied++;
}
console.log(`[copy-duckdb] public/duckdb ready (${copied} file(s) updated).`);
