// Generates the datasets and hidden fixtures for two Tier 1 cases, deterministically.
//   npx tsx scripts/content/build-tier1-cases.ts
// Re-running produces identical files. mission.json for each case is written by hand.

import fs from 'node:fs';
import path from 'node:path';
import { toCsv } from '../../src/server/content/csv';

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const int = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
const pick = <T,>(r: () => number, xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
const t = (r: () => number, day: string) => `${day} ${String(int(r, 8, 20)).padStart(2, '0')}:${String(int(r, 0, 59)).padStart(2, '0')}:00`;

const ROOT = path.join(process.cwd(), 'content', 'missions');
function write(mission: string, sub: string, table: string, header: string[], rows: (string | number | null)[][]) {
  const dir = path.join(ROOT, mission, sub);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${table}.csv`), toCsv(header, rows));
}

// ── Baba Sola's POS kiosk: reconcile cash paid out against the POS log ──────
// Baba Sola does POS cash-outs: a customer pays by card, he hands over cash. If the POS
// transaction failed (network) or was never logged, he has handed out cash for nothing.
const CUSTOMERS = ['Emeka', 'Funke', 'Musa', 'Ada', 'Tayo', 'Ibrahim', 'Chioma', 'Segun', 'Halima', 'Kunle', 'Blessing', 'Yusuf'];
function posCase(seed: number, opts: { failed: number; missing: number; days: string[]; perDay: [number, number] }) {
  const r = rng(seed);
  const cash: (string | number)[][] = [];
  const pos: (string | number)[][] = [];
  let n = 5000 + int(r, 0, 900);
  for (const day of opts.days) {
    for (let i = int(r, ...opts.perDay); i > 0; i--) {
      const ref = `POS-${n++}`;
      const when = t(r, day);
      const amount = int(r, 2, 40) * 500;
      cash.push([ref, when, pick(r, CUSTOMERS), amount]);
      pos.push([ref, when, amount, 'success']);
    }
  }
  // Some payouts whose POS transaction failed, and some never logged at all.
  const idx = cash.map((_, i) => i).sort(() => r() - 0.5);
  idx.slice(0, opts.failed).forEach((i) => { pos[i][3] = 'failed'; });
  const drop = new Set(idx.slice(opts.failed, opts.failed + opts.missing));
  const posRows = pos.filter((_, i) => !drop.has(i));
  // A few successful POS rows that aren't cash-outs (airtime sales) add noise.
  for (let i = 0; i < 2; i++) posRows.push([`AIR-${int(r, 100, 999)}`, t(r, opts.days[0]), int(r, 1, 10) * 100, 'success']);
  return { cash, pos: posRows.sort((a, b) => String(a[1]).localeCompare(String(b[1]))) };
}

const POS_ID = 'tier1_pos_reconciliation';
const CASH_H = ['ref', 'paid_at', 'customer', 'amount'];
const POS_H = ['txn_id', 'logged_at', 'amount', 'status'];
{
  const visible = posCase(41, { failed: 2, missing: 2, days: ['2026-11-12', '2026-11-13'], perDay: [9, 11] });
  write(POS_ID, 'dataset', 'cash_book', CASH_H, visible.cash);
  write(POS_ID, 'dataset', 'pos_log', POS_H, visible.pos);
  const fx = {
    'network-day': posCase(77, { failed: 7, missing: 0, days: ['2026-11-14'], perDay: [14, 16] }),
    'never-logged': posCase(93, { failed: 0, missing: 5, days: ['2026-11-15', '2026-11-16'], perDay: [8, 10] }),
    'clean-day': posCase(105, { failed: 0, missing: 0, days: ['2026-11-17'], perDay: [10, 12] }),
  };
  for (const [id, d] of Object.entries(fx)) {
    write(POS_ID, `fixtures/${id}`, 'cash_book', CASH_H, d.cash);
    write(POS_ID, `fixtures/${id}`, 'pos_log', POS_H, d.pos);
  }
  const ok = new Set(visible.pos.filter((p) => p[3] === 'success').map((p) => p[0]));
  const lost = visible.cash.filter((c) => !ok.has(c[0]));
  console.log(`${POS_ID}: ${lost.length} unpaid payouts, ₦${lost.reduce((s, c) => s + Number(c[3]), 0).toLocaleString()} lost`);
}

// ── Zee Fabrics: rank fabrics by revenue when prices change sale to sale ────
const FABRICS = ['Ankara (Dutch wax)', 'Swiss lace', 'Aso-oke', 'George wrapper', 'Adire', 'Brocade', 'Chiffon'];
function fabricCase(seed: number, opts: { rows: number; priceSwing: number }) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const r = rng(seed + attempt * 977);
    const base = Object.fromEntries(FABRICS.map((f) => [f, int(r, 4, 30) * 500]));
    const rows: (string | number)[][] = [];
    for (let i = 1; i <= opts.rows; i++) {
      const fabric = pick(r, FABRICS);
      const wholesale = r() < 0.3;
      const yards = wholesale ? int(r, 10, 30) : int(r, 2, 8);
      // Wholesale buyers get a big discount, so price per yard changes from sale to sale.
      const price = Math.round(base[fabric] * (wholesale ? 1 - opts.priceSwing : 1 + r() * 0.15) / 50) * 50;
      rows.push([i, t(r, pick(r, ['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13'])), fabric, yards, price, wholesale ? 'wholesale' : 'retail']);
    }
    const rev: Record<string, number> = {}, yd: Record<string, number> = {};
    for (const x of rows) { rev[String(x[2])] = (rev[String(x[2])] ?? 0) + Number(x[3]) * Number(x[4]); yd[String(x[2])] = (yd[String(x[2])] ?? 0) + Number(x[3]); }
    const revVals = Object.values(rev).sort((a, b) => b - a);
    const topRev = Object.entries(rev).sort((a, b) => b[1] - a[1])[0][0];
    const topYd = Object.entries(yd).sort((a, b) => b[1] - a[1])[0][0];
    const ydVals = Object.values(yd).sort((a, b) => b - a);
    // Need: no ties around the top 3, a unique yard leader, and (for the visible data) a leader that differs.
    if (new Set(revVals.slice(0, 4)).size === 4 && ydVals[0] !== ydVals[1]) return { rows: rows.sort((a, b) => String(a[1]).localeCompare(String(b[1]))), topRev, topYd, rev, yd };
  }
  throw new Error('could not generate a tie-free fabric case');
}

const ZEE_ID = 'tier1_zee_fabrics_restock';
const ZEE_H = ['sale_id', 'sold_at', 'fabric', 'yards', 'price_per_yard', 'customer_type'];
{
  let visible = fabricCase(7, { rows: 48, priceSwing: 0.45 });
  for (let s = 8; visible.topRev === visible.topYd; s++) visible = fabricCase(s, { rows: 48, priceSwing: 0.45 });
  write(ZEE_ID, 'dataset', 'sales', ZEE_H, visible.rows);
  write(ZEE_ID, 'fixtures/wholesale-heavy', 'sales', ZEE_H, fabricCase(211, { rows: 60, priceSwing: 0.6 }).rows);
  write(ZEE_ID, 'fixtures/another-week', 'sales', ZEE_H, fabricCase(307, { rows: 40, priceSwing: 0.35 }).rows);
  console.log(`${ZEE_ID}: top revenue = ${visible.topRev}, most yards = ${visible.topYd}`);
  console.log(Object.entries(visible.rev).sort((a, b) => b[1] - a[1]).map(([f, v]) => `  ${f}: ₦${v.toLocaleString()} (${visible.yd[f]} yd)`).join('\n'));
}
