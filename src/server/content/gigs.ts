import type { MissionDef, Row, TableDef } from '@/shared/types/content';
import type { Fixture } from '@/server/assessment/fixtures/types';
import type { MissionPackage } from './missions';
import { toFixtureTables } from './missions';

// Procedural Tier 1 side gigs. Each gig is fully determined by (template, seed): the same id
// always regenerates the same business, dataset, hidden fixtures and answer, so nothing has to be
// stored. The job board shows a fresh set every in-game day.

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
const int = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));

const BUSINESSES = [
  { name: "Iya Basira's Buka", owner: 'Iya Basira', items: ['Amala & Ewedu', 'Jollof Rice', 'Pounded Yam', 'Beef', 'Ponmo', 'Zobo'], price: [500, 3500] },
  { name: 'Femi Cuts Barbing Salon', owner: 'Femi', items: ['Haircut', 'Beard Trim', 'Hair Dye', 'Shave', 'Kids Cut'], price: [1000, 6000] },
  { name: 'Bola Provisions', owner: 'Mrs Bola', items: ['Indomie Carton', 'Peak Milk Tin', 'Sugar Pack', 'Bread', 'Groundnut Oil', 'Rice 5kg'], price: [400, 9000] },
  { name: "Chika's Phone Accessories", owner: 'Chika', items: ['Phone Case', 'Charger', 'Earpiece', 'Screen Guard', 'Power Bank', 'USB Cable'], price: [800, 15000] },
  { name: "Mummy Tobi's Akara Spot", owner: 'Mummy Tobi', items: ['Akara', 'Pap', 'Bread', 'Moi Moi', 'Fried Yam'], price: [100, 1500] },
  { name: 'Ngozi Hair Studio', owner: 'Ngozi', items: ['Braids', 'Wash & Set', 'Weave-on', 'Cornrows', 'Treatment'], price: [3000, 25000] },
] as const;

const DAYS = ['2026-11-10', '2026-11-11', '2026-11-12'];
const time = (r: () => number) => `${String(int(r, 7, 20)).padStart(2, '0')}:${String(int(r, 0, 59)).padStart(2, '0')}:00`;
const price = (r: () => number, [lo, hi]: readonly number[]) => Math.round((lo + r() * (hi - lo)) / 50) * 50;

type Template = 'dupes' | 'top';
const TEMPLATES: Template[] = ['dupes', 'top'];

// ── Template: duplicate receipts ─────────────────────────────────────────────
const RECEIPTS: TableDef = {
  name: 'receipts',
  description: 'Receipts printed by the shop’s POS terminal. The printer sometimes prints the same receipt twice.',
  columns: [
    { name: 'receipt_no', type: 'VARCHAR', desc: 'Receipt number (unique per real sale)' },
    { name: 'sold_at', type: 'TIMESTAMP', desc: 'Date and time of sale' },
    { name: 'item', type: 'VARCHAR', desc: 'What was sold' },
    { name: 'amount', type: 'DOUBLE', desc: 'Amount paid in naira (₦)' },
  ],
};

function receiptRows(r: () => number, biz: (typeof BUSINESSES)[number], dupes: number): Row[] {
  const rows: Row[] = [];
  let n = 1000 + int(r, 0, 800);
  for (const day of DAYS) {
    for (let i = int(r, 6, 10); i > 0; i--) rows.push({ receipt_no: `R-${n++}`, sold_at: `${day} ${time(r)}`, item: pick(r, biz.items), amount: price(r, biz.price) });
  }
  for (let i = 0; i < dupes; i++) rows.push({ ...rows[int(r, 0, rows.length - 1)] });
  return rows.sort((a, b) => String(a.sold_at).localeCompare(String(b.sold_at)));
}

function trueDaily(rows: Row[]) {
  const seen = new Set<string>(), tot: Record<string, number> = {};
  for (const x of rows) {
    if (seen.has(String(x.receipt_no))) continue;
    seen.add(String(x.receipt_no));
    const d = String(x.sold_at).slice(0, 10);
    tot[d] = (tot[d] ?? 0) + Number(x.amount);
  }
  return tot;
}

// ── Template: top sellers ────────────────────────────────────────────────────
const SALES: TableDef = {
  name: 'sales',
  description: 'Sales book. Cancelled sales never got paid.',
  columns: [
    { name: 'sale_id', type: 'INTEGER', desc: 'Sale number', pk: true },
    { name: 'sold_at', type: 'TIMESTAMP', desc: 'Date and time of sale' },
    { name: 'item', type: 'VARCHAR', desc: 'What was sold' },
    { name: 'qty', type: 'INTEGER', desc: 'How many' },
    { name: 'unit_price', type: 'DOUBLE', desc: 'Price per unit in naira (₦)' },
    { name: 'status', type: 'VARCHAR', desc: 'completed or cancelled' },
  ],
};

function salesRows(r: () => number, biz: (typeof BUSINESSES)[number], bigCancels: number): Row[] {
  const rows: Row[] = [];
  const unit = Object.fromEntries(biz.items.map((it) => [it, price(r, biz.price)]));
  let id = 1;
  for (const day of DAYS) for (let i = int(r, 7, 11); i > 0; i--) {
    const item = pick(r, biz.items);
    rows.push({ sale_id: id++, sold_at: `${day} ${time(r)}`, item, qty: int(r, 1, 4), unit_price: unit[item], status: r() < 0.12 ? 'cancelled' : 'completed' });
  }
  // Large cancelled orders on a low seller: wrong if you forget the status filter.
  const totals = completedTotals(rows);
  const weakest = Object.entries(totals).sort((a, b) => a[1] - b[1])[0]?.[0] ?? biz.items[0];
  for (let i = 0; i < bigCancels; i++) rows.push({ sale_id: id++, sold_at: `${pick(r, DAYS)} ${time(r)}`, item: weakest, qty: int(r, 15, 30), unit_price: unit[weakest], status: 'cancelled' });
  return rows;
}

function completedTotals(rows: Row[]) {
  const t: Record<string, number> = {};
  for (const x of rows) if (x.status === 'completed') t[String(x.item)] = (t[String(x.item)] ?? 0) + Number(x.qty) * Number(x.unit_price);
  return t;
}

const distinctTop = (totals: Record<string, number>, k: number) => {
  const v = Object.values(totals).sort((a, b) => b - a);
  return v.length > k && new Set(v.slice(0, k + 1)).size === k + 1; // no ties at or around the cut
};

// ── Build a package ──────────────────────────────────────────────────────────
function build(template: Template, seed: number): MissionPackage | undefined {
  const r = rng(seed * 7919 + (template === 'dupes' ? 1 : 2));
  const biz = BUSINESSES[seed % BUSINESSES.length];
  const id = `gig-${template}-${seed}`;
  const base = {
    id, kind: 'gig' as const, tier: 1 as const, skill: 'SQL' as const, passMark: 75, xp: 40,
    location: { district: 'remote', remote: true },
  };

  if (template === 'dupes') {
    // Regenerate until the "best day" question has a single answer.
    let rows: Row[] = [], daily: Record<string, number> = {};
    for (let tries = 0; tries < 20; tries++) {
      rows = receiptRows(r, biz, int(r, 3, 5));
      daily = trueDaily(rows);
      const v = Object.values(daily).sort((a, b) => b - a);
      if (v[0] !== v[1]) break;
    }
    const best = Object.entries(daily).sort((a, b) => b[1] - a[1])[0][0];
    const fixtures: Fixture[] = [
      { id: 'variant-a', purpose: 'Another week of receipts', failHint: 'Your daily totals don’t match the real sales.', data: { receipts: receiptRows(rng(seed + 11), biz, 3) } },
      { id: 'many-dupes', purpose: 'A week when the printer misbehaved badly', failHint: 'Some receipts are being counted more than once.', data: { receipts: receiptRows(rng(seed + 23), biz, 12) } },
      { id: 'no-dupes', purpose: 'A clean week with no duplicates', failHint: 'Your query should also work when there are no duplicates.', data: { receipts: receiptRows(rng(seed + 37), biz, 0) } },
    ].map((f) => ({ id: f.id, purpose: f.purpose, failHint: f.failHint, tables: toFixtureTables([RECEIPTS], f.data) }));
    const def: MissionDef = {
      ...base,
      title: `Double receipts at ${biz.name}`,
      summary: 'The POS printer prints some receipts twice. Find the true takings per day.',
      pay: 6000 + (seed % 5) * 500,
      client: {
        name: biz.owner, business: biz.name,
        brief: [`My POS printer has been acting up. Some receipts came out twice and now my totals look better than my cash.`, `Can you work out what I really sold each day?`],
        thanks: 'Ah, now it makes sense. Thank you!',
      },
      starterSql: `-- ${biz.name}: true takings per day\n-- Some receipts were printed twice (same receipt_no).\n\nSELECT *\nFROM receipts\nORDER BY receipt_no\nLIMIT 30;`,
      tables: [RECEIPTS],
      hints: [
        { title: 'Hint 1: What a duplicate looks like', desc: 'A real sale has one receipt_no. If the same receipt_no appears twice, it’s the same sale printed twice.' },
        { title: 'Hint 2: Remove repeats first', desc: 'Get one row per receipt before you add anything up, for example with SELECT DISTINCT in a subquery.', snippet: 'SELECT DISTINCT * FROM receipts' },
        { title: 'Hint 3: Then group by day', desc: 'Turn sold_at into a date and SUM(amount) per day.' },
      ],
      findings: [{ id: 'best_day', claim: 'Which day had the highest true takings?', options: Object.keys(daily).sort().map((d) => ({ id: d, text: new Date(`${d}T12:00:00`).toDateString(), correct: d === best })) }],
      successFeedback: `Correct. Once each receipt is counted once, ${biz.owner}'s takings match the cash box.`,
      trapFixture: 'many-dupes',
      fixtures: fixtures.map(({ id: fid, purpose, failHint }) => ({ id: fid, purpose, failHint })),
    };
    return {
      def, data: { receipts: rows },
      grading: { missionId: id, trapFixtureId: 'many-dupes', fixtures, referenceSql: `SELECT CAST(sold_at AS DATE) AS day, SUM(amount) AS revenue FROM (SELECT DISTINCT * FROM receipts) GROUP BY 1` },
    };
  }

  // top sellers
  let rows: Row[] = [];
  for (let tries = 0; tries < 30; tries++) { rows = salesRows(r, biz, 2); if (distinctTop(completedTotals(rows), 3)) break; }
  const variant = (s: number, cancels: number) => { let v: Row[] = []; for (let t = 0; t < 30; t++) { v = salesRows(rng(s + t * 101), biz, cancels); if (distinctTop(completedTotals(v), 3)) break; } return v; };
  const top = Object.entries(completedTotals(rows)).sort((a, b) => b[1] - a[1]);
  const fixtures: Fixture[] = [
    { id: 'variant-a', purpose: 'Another week of sales', failHint: 'Your top three items or their revenue don’t match.', data: { sales: variant(seed + 13, 1) } },
    { id: 'big-cancels', purpose: 'Huge cancelled orders on a slow item', failHint: 'Cancelled sales are still counting towards revenue.', data: { sales: variant(seed + 29, 4) } },
    { id: 'quiet-week', purpose: 'A quieter week with no bulk cancellations', failHint: 'Your query should give the right top three on any week, not just this one.', data: { sales: variant(seed + 41, 0) } },
  ].map((f) => ({ id: f.id, purpose: f.purpose, failHint: f.failHint, tables: toFixtureTables([SALES], f.data) }));
  const options = [top[0][0], top[1][0], top[top.length - 1][0]].sort();
  const def: MissionDef = {
    ...base,
    title: `What sells at ${biz.name}?`,
    summary: 'Find the three items that brought in the most money. Ignore cancelled sales.',
    pay: 7000 + (seed % 4) * 750,
    client: {
      name: biz.owner, business: biz.name,
      brief: ['I want to restock before the weekend but money is tight.', 'Which three things bring in the most money? Don’t count cancelled sales; those people never paid.'],
      thanks: 'Perfect. I’ll stock up on those first.',
    },
    starterSql: `-- ${biz.name}: top 3 items by completed revenue\n\nSELECT *\nFROM sales\nLIMIT 30;`,
    tables: [SALES],
    hints: [
      { title: 'Hint 1: Money, not count', desc: 'Revenue for a sale is qty × unit_price. Only completed sales count.' },
      { title: 'Hint 2: Per item', desc: "Filter with WHERE status = 'completed', then GROUP BY item.", snippet: "WHERE status = 'completed'\nGROUP BY item" },
      { title: 'Hint 3: Keep the top three', desc: 'Sort by revenue from highest to lowest and LIMIT 3. Return the item and its revenue.' },
    ],
    findings: [{ id: 'restock_first', claim: `What should ${biz.owner} restock first?`, options: options.map((it) => ({ id: it, text: it, correct: it === top[0][0] })) }],
    successFeedback: `Right. ${top[0][0]} leads, and the cancelled bulk orders were a red herring.`,
    trapFixture: 'big-cancels',
    fixtures: fixtures.map(({ id: fid, purpose, failHint }) => ({ id: fid, purpose, failHint })),
  };
  return {
    def, data: { sales: rows },
    grading: { missionId: id, trapFixtureId: 'big-cancels', fixtures, referenceSql: `SELECT item, SUM(qty * unit_price) AS revenue FROM sales WHERE status = 'completed' GROUP BY item ORDER BY revenue DESC LIMIT 3` },
  };
}

/** Today's gigs: three per day, changing at midnight UTC. */
export function generatedGigs(now = new Date()): MissionPackage[] {
  const day = Math.floor(now.getTime() / 86_400_000);
  return [0, 1, 2].map((i) => build(TEMPLATES[(day + i) % TEMPLATES.length], (day * 3 + i) % 997)).filter(Boolean) as MissionPackage[];
}

export function getGeneratedGig(id: string): MissionPackage | undefined {
  const m = id.match(/^gig-(dupes|top)-(\d+)$/);
  return m ? build(m[1] as Template, Number(m[2])) : undefined;
}
