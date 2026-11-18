import { DuckDBInstance } from '@duckdb/node-api';
import type { CaseFixtures, Cell, Fixture } from './fixtures/types';
import { getMission } from '@/server/content/missions';

// Authoritative SQL grading. The player's query and the case's reference query both run in a
// fresh, isolated in-memory DuckDB per hidden fixture. Results are compared as data, so any
// correct query passes (column names, column order, row order and tiny float differences don't
// matter) and keyword-stuffed wrong queries fail.

export const GRADER_LIMITS = { timeoutMs: 3000, maxRows: 5000 } as const;

function caseFor(missionId: string): CaseFixtures | undefined {
  return getMission(missionId)?.grading;
}

export function hasFixtures(missionId: string) {
  return !!caseFor(missionId);
}

export interface FixtureResult {
  id: string;
  passed: boolean;
  /** Feedback for a failed fixture; null when passed. Never contains the expected answer. */
  hint: string | null;
  error?: string;
}

export interface GradeResult {
  missionId: string;
  fixtures: FixtureResult[];
  passRate: number;
  trapPassed: boolean;
  /** Set when the query could not run at all (syntax error, unknown column, timeout). */
  queryError: string | null;
}

type Rows = unknown[][];

const sqlLiteral = (v: Cell) => (v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);

async function withFixtureDb<T>(fixture: Fixture, fn: (run: (sql: string) => Promise<Rows>) => Promise<T>): Promise<T> {
  const instance = await DuckDBInstance.create(':memory:', {
    enable_external_access: 'false', // no files, no HTTP, no ATTACH
    autoinstall_known_extensions: 'false',
    autoload_known_extensions: 'false',
    threads: '1',
    max_memory: '256MB',
  });
  const conn = await instance.connect();
  try {
    for (const t of fixture.tables) {
      await conn.run(`CREATE TABLE ${t.name} (${t.columns.join(', ')})`);
      if (t.rows.length) await conn.run(`INSERT INTO ${t.name} VALUES ${t.rows.map((r) => `(${r.map(sqlLiteral).join(', ')})`).join(', ')}`);
    }
    await conn.run('SET lock_configuration = true');
    const run = async (sql: string) => {
      const timer = setTimeout(() => conn.interrupt(), GRADER_LIMITS.timeoutMs);
      try {
        const reader = await conn.runAndReadAll(sql);
        const rows = reader.getRowsJson() as Rows;
        if (rows.length > GRADER_LIMITS.maxRows) throw new Error(`Result has more than ${GRADER_LIMITS.maxRows} rows.`);
        return rows;
      } finally {
        clearTimeout(timer);
      }
    };
    return await fn(run);
  } finally {
    conn.closeSync();
    instance.closeSync();
  }
}

/** Canonical form of a result: values normalised, columns and rows order-independent. */
export function canonical(rows: Rows): string[] {
  const norm = (v: unknown): string => {
    if (v === null || v === undefined) return '∅';
    if (typeof v === 'number') return (Math.round(v * 100) / 100).toFixed(2);
    if (typeof v === 'string') {
      if (/^-?\d+(\.\d+)?$/.test(v)) return (Math.round(Number(v) * 100) / 100).toFixed(2); // bigints/decimals arrive as strings
      const date = v.match(/^(\d{4}-\d{2}-\d{2})(?:[ T]00:00:00(?:\.0+)?)?$/); // a midnight timestamp equals its date
      if (date) return date[1];
      return v.trim();
    }
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    return JSON.stringify(v);
  };
  const isZeroish = (s: string) => s === '∅' || s === '0.00';
  return rows
    .map((r) => r.map(norm))
    // A row whose numbers are all zero/empty adds no information (e.g. a day with no completed sales).
    .filter((r) => !(r.some((s) => /^-?\d+\.\d{2}$/.test(s) || s === '∅') && r.filter((s) => /^-?\d+\.\d{2}$/.test(s) || s === '∅').every(isZeroish)))
    .map((r) => JSON.stringify([...r].sort()))
    .sort();
}

function sameResult(a: Rows, b: Rows) {
  const x = canonical(a), y = canonical(b);
  return x.length === y.length && x.every((v, i) => v === y[i]);
}

export async function gradeSql(missionId: string, userSql: string, spec: CaseFixtures | undefined = caseFor(missionId)): Promise<GradeResult> {
  if (!spec) throw new Error(`No grading fixtures for mission ${missionId}`);
  const fixtures: FixtureResult[] = [];
  let queryError: string | null = null;

  for (const fx of spec.fixtures) {
    const result = await withFixtureDb(fx, async (run) => {
      const expected = await run(spec.referenceSql);
      try {
        const actual = await run(userSql);
        const passed = sameResult(actual, expected);
        return { id: fx.id, passed, hint: passed ? null : fx.failHint };
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { id: fx.id, passed: false, hint: 'Your query could not run on this data.', error: msg };
      }
    });
    if (result.error && !queryError) queryError = cleanError(result.error);
    fixtures.push(result);
  }

  const passed = fixtures.filter((f) => f.passed).length;
  return {
    missionId,
    fixtures,
    passRate: passed / fixtures.length,
    trapPassed: fixtures.find((f) => f.id === spec.trapFixtureId)?.passed ?? false,
    queryError,
  };
}

function cleanError(msg: string) {
  if (/interrupt/i.test(msg)) return `Your query took longer than ${GRADER_LIMITS.timeoutMs / 1000} seconds.`;
  return msg.replace(/\s+/g, ' ').slice(0, 300);
}
