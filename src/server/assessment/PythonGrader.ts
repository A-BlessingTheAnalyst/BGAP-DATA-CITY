import { loadPyodide, type PyodideInterface } from 'pyodide';
import { PythonSandboxRunner } from './PythonSandboxRunner';
import type { PyCaseFixtures, PyFixture } from './fixtures/types';
import { getMission } from '@/server/content/missions';

// Authoritative Python grading, mirroring SqlGrader.ts: the player's code and the case's
// reference code both run against every hidden fixture's data, and the two *results* are
// compared (not the code) — any correct approach passes, a wrong one fails regardless of style.
//
// Fixtures reuse the exact dataset/fixtures CSV pipeline SQL missions already use (missions.ts) —
// Python just gets each table as a `list[dict]` global instead of a DuckDB table. The player's
// code must set a variable named `result` (any JSON-ish value: number, string, list, dict); so
// must reference.py. There is no execution-time kill-switch yet — see PythonSandboxRunner.ts's
// header comment and masterprompt.md §15.4 for why, and what a real fix looks like.

export const PY_GRADER_LIMITS = { maxRows: 5000 } as const;

function caseFor(missionId: string): PyCaseFixtures | undefined {
  return getMission(missionId)?.pyGrading;
}

export function hasPyFixtures(missionId: string) {
  return !!caseFor(missionId);
}

export interface PyFixtureResult {
  id: string;
  passed: boolean;
  hint: string | null;
  error?: string;
}

export interface PyGradeResult {
  missionId: string;
  fixtures: PyFixtureResult[];
  passRate: number;
  trapPassed: boolean;
  /** Set when the code didn't run at all (syntax error, exception, no `result` set). */
  codeError: string | null;
}

let sharedPyodide: Promise<PyodideInterface> | null = null;
/** Pyodide takes ~1-2s to boot; reused across fixtures within one grade() call and across calls
 * within one server process (each run still gets a fresh globals dict — see runOnce). */
function pyodide(): Promise<PyodideInterface> {
  return (sharedPyodide ??= loadPyodide());
}

function toPlain(value: unknown): unknown {
  const v = value as { toJs?: (opts: Record<string, unknown>) => unknown; destroy?: () => void };
  if (v && typeof v.toJs === 'function') {
    const plain = v.toJs({ dict_converter: Object.fromEntries });
    v.destroy?.();
    return plain;
  }
  return value;
}

/** Runs `code` against one fixture's tables and returns its `result` global (or throws). */
async function runOnce(py: PyodideInterface, code: string, tables: Record<string, Record<string, unknown>[]>): Promise<unknown> {
  for (const rows of Object.values(tables)) {
    if (rows.length > PY_GRADER_LIMITS.maxRows) throw new Error('Too many rows for a single fixture.');
  }
  const globals = py.toPy({});
  try {
    for (const [name, rows] of Object.entries(tables)) globals.set(name, py.toPy(rows));
    py.runPython(code, { globals });
    if (!globals.has('result')) throw new Error("Your code must set a variable named `result`.");
    return toPlain(globals.get('result'));
  } finally {
    globals.destroy();
  }
}

/** Data-equality with float tolerance (mirrors SqlGrader's "tiny float differences don't
 * matter"), recursing into lists/dicts. */
function resultsEqual(a: unknown, b: unknown): boolean {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-6 || Math.abs(a - b) <= 1e-9 * Math.max(Math.abs(a), Math.abs(b));
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => resultsEqual(x, b[i]));
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ak = Object.keys(a as object).sort(), bk = Object.keys(b as object).sort();
    if (ak.length !== bk.length || ak.some((k, i) => k !== bk[i])) return false;
    return ak.every((k) => resultsEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
  }
  return a === b;
}

export async function gradePython(missionId: string, code: string, override?: PyCaseFixtures): Promise<PyGradeResult> {
  const kase = override ?? caseFor(missionId);
  if (!kase) throw new Error(`No Python fixtures for mission "${missionId}".`);

  let codeError: string | null = null;
  try {
    PythonSandboxRunner.enforceConstraints(code);
  } catch (e) {
    codeError = e instanceof Error ? e.message : String(e);
  }

  const fixtures: PyFixtureResult[] = [];
  if (!codeError) {
    const py = await pyodide();
    for (const fx of kase.fixtures as PyFixture[]) {
      try {
        const [expected, actual] = await Promise.all([
          runOnce(py, kase.referencePython, fx.tables),
          runOnce(py, code, fx.tables),
        ]);
        const passed = resultsEqual(expected, actual);
        fixtures.push({ id: fx.id, passed, hint: passed ? null : fx.failHint });
      } catch (e) {
        fixtures.push({ id: fx.id, passed: false, hint: fx.failHint, error: e instanceof Error ? e.message : String(e) });
      }
    }
  } else {
    for (const fx of kase.fixtures as PyFixture[]) fixtures.push({ id: fx.id, passed: false, hint: fx.failHint, error: codeError });
  }

  const passRate = fixtures.length ? fixtures.filter((f) => f.passed).length / fixtures.length : 0;
  const trapPassed = fixtures.find((f) => f.id === kase.trapFixtureId)?.passed ?? false;
  return { missionId, fixtures, passRate, trapPassed, codeError };
}
