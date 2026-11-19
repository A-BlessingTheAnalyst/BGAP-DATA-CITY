// Hidden grading fixtures. Server-only: never import these from client code.

export type Cell = string | number | null;

export interface FixtureTable {
  name: string;
  /** Column definitions in DuckDB SQL, e.g. "id INTEGER". */
  columns: string[];
  rows: Cell[][];
}

export interface Fixture {
  id: string;
  /** What this fixture is designed to catch, shown in feedback when it fails. */
  purpose: string;
  /** Feedback when the player's result differs on this fixture. Must not reveal the answer. */
  failHint: string;
  tables: FixtureTable[];
}

export interface CaseFixtures {
  missionId: string;
  /** Canonical answer. Run on every fixture to produce the expected result. */
  referenceSql: string;
  fixtures: Fixture[];
  /** The fixture built for this case's main trap; scores the "edge cases" component. */
  trapFixtureId: string;
}

// ── Python missions (skill: "Python") ───────────────────────────────────────────────────
// Reuses the exact same dataset/fixtures CSV pipeline as SQL missions (missions.ts's
// loadPackage already produces plain Record<string, Row[]> data per fixture) — Python just
// gets those rows as a list[dict] global per table instead of a DuckDB table. See
// PythonGrader.ts. A mission is Python-graded when its folder has reference.py instead of
// reference.sql (missions.ts picks the right one).

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export interface PyFixture {
  id: string;
  purpose: string;
  failHint: string;
  /** One list[dict] global per table, keyed by table name (same tables as def.tables). */
  tables: Record<string, Record<string, Cell>[]>;
}

export interface PyCaseFixtures {
  missionId: string;
  referencePython: string;
  fixtures: PyFixture[];
  trapFixtureId: string;
}
