import { Parser } from 'node-sql-parser';

// First line of defence before a query reaches DuckDB: one read-only statement only.
// The DuckDB instance is also locked down (no external access, no extensions, locked config),
// so a query that slips past the parser still can't touch files, the network or settings.

const FORBIDDEN = [
  'DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'CREATE', 'REPLACE', 'MERGE',
  'ATTACH', 'DETACH', 'COPY', 'EXPORT', 'IMPORT', 'INSTALL', 'LOAD', 'PRAGMA', 'SET', 'RESET',
  'CALL', 'EXECUTE', 'EXEC', 'CHECKPOINT', 'VACUUM', 'GRANT', 'REVOKE',
];
const FORBIDDEN_FUNCTIONS = /\b(read_csv\w*|read_parquet|read_json\w*|read_text|read_blob|glob|parquet_scan|csv_scan|httpfs|getenv|duckdb_\w+|pragma_\w+)\s*\(/i;

export class SandboxRunner {
  static readonly MAX_LENGTH = 5000;
  private static parser = new Parser();

  /** Throws a player-readable error if the query is not a single read-only SELECT. */
  static enforceConstraints(query: string): true {
    const sql = (query ?? '').trim();
    if (!sql) throw new Error('Your query is empty.');
    if (sql.length > this.MAX_LENGTH) throw new Error(`Queries are limited to ${this.MAX_LENGTH} characters.`);

    // Strip comments and string literals before keyword checks so 'SET' inside a string is fine.
    const code = sql.replace(/--[^\n]*/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/'(?:[^']|'')*'/g, "''");
    if (code.replace(/;\s*$/, '').includes(';')) throw new Error('Only one statement is allowed per submission.');
    const upper = code.toUpperCase();
    for (const word of FORBIDDEN) {
      if (new RegExp(`\\b${word}\\b`).test(upper)) throw new Error(`"${word}" isn't allowed. Analysis queries must be read-only SELECT statements.`);
    }
    if (FORBIDDEN_FUNCTIONS.test(code)) throw new Error('Reading files, the network or system tables isn’t allowed. Query the tables provided.');

    // The AST check is advisory: DuckDB-only syntax may not parse as PostgreSQL, but if it
    // does parse, it must be a SELECT.
    try {
      const ast = this.parser.astify(sql, { database: 'postgresql' });
      const list = Array.isArray(ast) ? ast : [ast];
      const nonSelect = list.find((s) => s && (s as { type?: string }).type !== 'select');
      if (nonSelect) throw new Error('Only SELECT queries are allowed.');
    } catch (e) {
      if (e instanceof Error && e.message === 'Only SELECT queries are allowed.') throw e;
    }
    if (!/^\s*(\(\s*)*(SELECT|WITH|FROM)\b/i.test(code)) throw new Error('Start your query with SELECT or WITH.');
    return true;
  }
}
