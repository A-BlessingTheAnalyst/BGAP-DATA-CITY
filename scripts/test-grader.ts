// Grader acceptance tests (Phase A).  Run: npm run test:grader
// Correct-but-different queries must pass every hidden fixture; plausible wrong answers and
// keyword-stuffed queries must fail; unsafe queries must be rejected before they run.

import { gradeSql } from '../src/server/assessment/SqlGrader';
import { SandboxRunner } from '../src/server/assessment/SandboxRunner';
import { RubricEngine } from '../src/server/assessment/RubricEngine';

const MISSION = 'ch1_cafe_revenue_mystery';

const CORRECT: Record<string, string> = {
  'reference style': `SELECT CAST(sale_at AS DATE) AS sale_date, SUM(quantity * unit_price) AS revenue FROM sales WHERE payment_status = 'completed' GROUP BY 1 ORDER BY 1`,
  'date_trunc + aliases': `SELECT date_trunc('day', sale_at) AS d, SUM(unit_price * quantity) AS total FROM sales WHERE payment_status = 'completed' GROUP BY d`,
  'NOT IN statuses, columns swapped': `SELECT SUM(quantity*unit_price) AS money, sale_at::DATE AS day FROM sales WHERE payment_status NOT IN ('voided', 'refunded') GROUP BY day`,
  'CTE': `WITH ok AS (SELECT * FROM sales WHERE payment_status = 'completed') SELECT CAST(sale_at AS DATE) AS sale_date, SUM(quantity * unit_price) AS revenue FROM ok GROUP BY 1`,
  'CASE inside SUM (zero days allowed)': `SELECT CAST(sale_at AS DATE) AS dt, SUM(CASE WHEN payment_status = 'completed' THEN quantity * unit_price ELSE 0 END) AS revenue FROM sales GROUP BY 1`,
};

const WRONG: Record<string, string> = {
  'ignores status': `SELECT CAST(sale_at AS DATE) AS sale_date, SUM(quantity * unit_price) AS revenue FROM sales GROUP BY 1`,
  'forgets quantity': `SELECT CAST(sale_at AS DATE) AS sale_date, SUM(unit_price) AS revenue FROM sales WHERE payment_status = 'completed' GROUP BY 1`,
  'only drops voids': `SELECT CAST(sale_at AS DATE) AS sale_date, SUM(quantity * unit_price) AS revenue FROM sales WHERE payment_status != 'voided' GROUP BY 1`,
  'one grand total': `SELECT SUM(quantity * unit_price) AS revenue FROM sales WHERE payment_status = 'completed'`,
  'keyword stuffing': `SELECT 'payment_status = ''completed'' group by sum(quantity * unit_price)' AS note, 1 AS x`,
};

const UNSAFE = [
  `DROP TABLE sales`,
  `SELECT * FROM sales; DELETE FROM sales`,
  `SELECT * FROM read_csv('/etc/passwd')`,
  `ATTACH 'evil.db'`,
  `SET enable_external_access = true`,
];

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? '  ✓' : '  ✗'} ${label}`);
  if (!ok) failures++;
};

async function main() {
  console.log('Correct queries pass every fixture');
  for (const [name, sql] of Object.entries(CORRECT)) {
    const r = await gradeSql(MISSION, sql);
    check(r.passRate === 1 && !r.queryError, `${name}${r.passRate < 1 ? ` (failed: ${r.fixtures.filter((f) => !f.passed).map((f) => f.id).join(', ')}${r.queryError ? `; ${r.queryError}` : ''})` : ''}`);
  }

  console.log('Wrong queries fail');
  for (const [name, sql] of Object.entries(WRONG)) {
    const r = await gradeSql(MISSION, sql);
    check(r.passRate < 1, `${name} (pass rate ${(r.passRate * 100).toFixed(0)}%)`);
  }

  console.log('Unsafe queries are rejected');
  for (const sql of UNSAFE) {
    let rejected = false;
    try { SandboxRunner.enforceConstraints(sql); } catch { rejected = true; }
    check(rejected, sql);
  }

  const grade = gradeSql;
  console.log('Rubric and pay');
  const pass = await RubricEngine.gradeSubmission({ missionId: MISSION, query: CORRECT['reference style'], findings: { cause: 'expl_refunds_and_voids', best_day: '2026-10-02' }, hintsUsed: 0 });
  check(pass.isPassed && pass.totalScore === 100 && pass.creditsEarned === 15000, `full marks → passed, 100, ₦15,000 (got ${pass.totalScore}, ₦${pass.creditsEarned})`);
  const fail = await RubricEngine.gradeSubmission({ missionId: MISSION, query: WRONG['ignores status'], explanationId: 'expl_refunds_and_voids', hintsUsed: 0 });
  check(!fail.isPassed && fail.scoreBreakdown.filter === 0, `ignoring status fails the trap fixture (score ${fail.totalScore})`);
  const broken = await RubricEngine.gradeSubmission({ missionId: MISSION, query: 'SELECT nope FROM sales', explanationId: 'expl_refunds_and_voids', hintsUsed: 0 });
  check(!broken.isPassed && !!broken.queryError, `a query that can't run reports its error ("${broken.queryError?.slice(0, 60)}…")`);

  const halfFindings = await RubricEngine.gradeSubmission({ missionId: MISSION, query: CORRECT['reference style'], findings: { cause: 'expl_refunds_and_voids', best_day: '2026-10-01' }, hintsUsed: 0 });
  check(halfFindings.scoreBreakdown.explanation === 10 && halfFindings.isPassed, `one wrong finding costs half the findings score (got ${halfFindings.scoreBreakdown.explanation})`);

  console.log('Baba Sola: reconcile cash book against POS log');
  const POS = 'tier1_pos_reconciliation';
  for (const [name, sql] of Object.entries({
    'NOT IN subquery': `SELECT ref, amount FROM cash_book WHERE ref NOT IN (SELECT txn_id FROM pos_log WHERE status = 'success')`,
    'LEFT JOIN anti-join': `SELECT c.ref, c.amount FROM cash_book c LEFT JOIN pos_log p ON p.txn_id = c.ref AND p.status = 'success' WHERE p.txn_id IS NULL`,
    'NOT EXISTS': `SELECT amount, ref FROM cash_book c WHERE NOT EXISTS (SELECT 1 FROM pos_log p WHERE p.txn_id = c.ref AND p.status = 'success')`,
  })) { const r = await grade(POS, sql); check(r.passRate === 1, `${name} passes`); }
  for (const [name, sql] of Object.entries({
    'ignores failed status': `SELECT ref, amount FROM cash_book WHERE ref NOT IN (SELECT txn_id FROM pos_log)`,
    'totals difference only': `SELECT (SELECT SUM(amount) FROM cash_book) - (SELECT SUM(amount) FROM pos_log WHERE status = 'success') AS lost`,
  })) { const r = await grade(POS, sql); check(r.passRate < 1, `${name} fails (${(r.passRate * 100).toFixed(0)}%)`); }

  console.log('Zee Fabrics: revenue when prices vary');
  const ZEE = 'tier1_zee_fabrics_restock';
  for (const [name, sql] of Object.entries({
    'SUM(yards*price)': `SELECT fabric, SUM(yards * price_per_yard) AS revenue FROM sales GROUP BY fabric ORDER BY revenue DESC LIMIT 3`,
    'CTE + window rank': `WITH t AS (SELECT fabric, SUM(yards * price_per_yard) AS rev FROM sales GROUP BY 1) SELECT fabric, rev FROM (SELECT *, RANK() OVER (ORDER BY rev DESC) rk FROM t) WHERE rk <= 3`,
  })) { const r = await grade(ZEE, sql); check(r.passRate === 1, `${name} passes`); }
  for (const [name, sql] of Object.entries({
    'top by yards': `SELECT fabric, SUM(yards) AS y FROM sales GROUP BY fabric ORDER BY y DESC LIMIT 3`,
    'yards × average price': `SELECT fabric, SUM(yards) * AVG(price_per_yard) AS revenue FROM sales GROUP BY fabric ORDER BY revenue DESC LIMIT 3`,
  })) { const r = await grade(ZEE, sql); check(r.passRate < 1, `${name} fails (${(r.passRate * 100).toFixed(0)}%)`); }

  console.log('Generated gigs');
  const { generatedGigs } = await import('../src/server/content/gigs');
  for (const gig of generatedGigs()) {
    const ref = await grade(gig.def.id, gig.grading.referenceSql, gig.grading);
    check(ref.passRate === 1, `${gig.def.id}: its own reference answer passes every fixture`);
    const lazy = await grade(gig.def.id, `SELECT * FROM ${gig.def.tables[0].name}`, gig.grading);
    check(lazy.passRate < 1, `${gig.def.id}: SELECT * fails`);
    check(gig.def.findings.every((f) => f.options.filter((o) => o.correct).length === 1), `${gig.def.id}: each finding has exactly one right answer`);
  }

  console.log('Sunrise Primary: partial payments with reversed/duplicate noise');
  const SUNRISE = 'tier2_sunrise_fees';
  for (const [name, sql] of Object.entries({
    'reference style': `SELECT s.name, s.term_fee - COALESCE(SUM(CASE WHEN p.status = 'confirmed' THEN p.amount END), 0) AS balance FROM students s LEFT JOIN payments p ON p.student_id = s.student_id GROUP BY s.student_id, s.name, s.term_fee HAVING s.term_fee - COALESCE(SUM(CASE WHEN p.status = 'confirmed' THEN p.amount END), 0) > 0`,
    'WHERE filter instead of CASE': `SELECT s.name, s.term_fee - COALESCE((SELECT SUM(amount) FROM payments p WHERE p.student_id = s.student_id AND p.status = 'confirmed'), 0) AS owed FROM students s WHERE s.term_fee - COALESCE((SELECT SUM(amount) FROM payments p WHERE p.student_id = s.student_id AND p.status = 'confirmed'), 0) > 0`,
    'CTE': `WITH paid AS (SELECT student_id, SUM(amount) AS total FROM payments WHERE status = 'confirmed' GROUP BY student_id) SELECT s.name, s.term_fee - COALESCE(paid.total, 0) AS balance FROM students s LEFT JOIN paid ON paid.student_id = s.student_id WHERE s.term_fee - COALESCE(paid.total, 0) > 0`,
  })) { const r = await grade(SUNRISE, sql); check(r.passRate === 1, `${name} passes`); }
  for (const [name, sql] of Object.entries({
    'counts every status': `SELECT s.name, s.term_fee - COALESCE(SUM(p.amount), 0) AS balance FROM students s LEFT JOIN payments p ON p.student_id = s.student_id GROUP BY s.student_id, s.name, s.term_fee HAVING s.term_fee - COALESCE(SUM(p.amount), 0) > 0`,
    'ignores reversed but keeps duplicate': `SELECT s.name, s.term_fee - COALESCE(SUM(CASE WHEN p.status != 'reversed' THEN p.amount END), 0) AS balance FROM students s LEFT JOIN payments p ON p.student_id = s.student_id GROUP BY s.student_id, s.name, s.term_fee HAVING s.term_fee - COALESCE(SUM(CASE WHEN p.status != 'reversed' THEN p.amount END), 0) > 0`,
  })) { const r = await grade(SUNRISE, sql); check(r.passRate < 1, `${name} fails (${(r.passRate * 100).toFixed(0)}%)`); }

  console.log('Musa Keke Fleet: cost per km with repair-bill and null-distance noise');
  const KEKE = 'tier2_keke_fleet';
  for (const [name, sql] of Object.entries({
    'reference style': `SELECT keke_id, SUM(cost) * 1.0 / SUM(distance_km) AS cost_per_km FROM keke_log WHERE category = 'fuel' AND distance_km IS NOT NULL GROUP BY keke_id ORDER BY cost_per_km DESC LIMIT 1`,
    'CTE + window rank': `WITH r AS (SELECT keke_id, SUM(cost) * 1.0 / SUM(distance_km) AS rate FROM keke_log WHERE category = 'fuel' AND distance_km IS NOT NULL GROUP BY keke_id) SELECT keke_id, rate FROM (SELECT *, RANK() OVER (ORDER BY rate DESC) rk FROM r) WHERE rk = 1`,
  })) { const r = await grade(KEKE, sql); check(r.passRate === 1, `${name} passes`); }
  for (const [name, sql] of Object.entries({
    'forgets the category filter': `SELECT keke_id, SUM(cost) * 1.0 / SUM(distance_km) AS cost_per_km FROM keke_log WHERE distance_km IS NOT NULL GROUP BY keke_id ORDER BY cost_per_km DESC LIMIT 1`,
    'treats a missing distance as zero': `SELECT keke_id, SUM(cost) * 1.0 / SUM(COALESCE(distance_km, 0) + 1) AS cost_per_km FROM keke_log WHERE category = 'fuel' GROUP BY keke_id ORDER BY cost_per_km DESC LIMIT 1`,
  })) { const r = await grade(KEKE, sql); check(r.passRate < 1, `${name} fails (${(r.passRate * 100).toFixed(0)}%)`); }

  console.log('Server-side attempts (hints and timing the client cannot fake)');
  {
    const os = await import('node:os');
    const fsMod = await import('node:fs');
    const pathMod = await import('node:path');
    process.env.DATA_CITY_DATA_DIR = fsMod.mkdtempSync(pathMod.join(os.tmpdir(), 'datacity-test-'));
    const A = await import('../src/server/game/attempts');
    const { getMission } = await import('../src/server/content/missions');
    const def = getMission(MISSION)!.def;
    const a = await A.startAttempt('tester', MISSION);
    const again = await A.startAttempt('tester', MISSION);
    check(again.id === a.id, 'reopening the terminal resumes the same attempt');
    check((await A.startAttempt('someone-else', MISSION)).id !== a.id, 'each player gets their own attempt');
    let refused = false;
    try { await A.revealHint('tester', a.id, 1, def.hints.length); } catch { refused = true; }
    check(refused, 'hints cannot be revealed out of order');
    await A.revealHint('tester', a.id, 0, def.hints.length);
    const twice = await A.revealHint('tester', a.id, 0, def.hints.length);
    check(twice.hintLog.length === 1, 're-opening a revealed hint is free');
    check((await A.getAttempt('someone-else', a.id)) === null, "players cannot read each other's attempts");
    check(A.isFast(a, def) && !A.isFast({ ...a, startedAt: new Date(Date.now() - 3 * 3600_000).toISOString() }, def), 'fast bonus follows the server start time');
    await A.recordSubmission('tester', a.id, { isPassed: true, totalScore: 90, creditsEarned: 1000 });
    check((await A.startAttempt('tester', MISSION)).id !== a.id, 'a passed attempt is closed; the next start is fresh');
    let closed = false;
    try { await A.revealHint('tester', a.id, 1, def.hints.length); } catch { closed = true; }
    check(closed, 'a closed attempt takes no more hints');
    const pub = (await import('../src/server/content/missions')).toPublic(def);
    check(pub.hints.every((h) => Object.keys(h).join() === 'title'), 'hint text is not sent to the browser before a reveal');
  }

  console.log(failures ? `\n${failures} check(s) failed` : '\nAll grader checks passed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
