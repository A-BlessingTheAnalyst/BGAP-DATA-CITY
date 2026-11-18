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
