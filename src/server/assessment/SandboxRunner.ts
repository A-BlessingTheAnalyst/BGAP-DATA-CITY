import { Parser } from 'node-sql-parser';

export class SandboxRunner {
  static readonly TIMEOUT_MS = 3000;
  static readonly MAX_ROWS = 500;
  private static parser = new Parser();

  static enforceConstraints(query: string): boolean {
    if (!query || !query.trim()) {
      throw new Error('Query string is empty.');
    }

    try {
      const ast = this.parser.astify(query, { database: 'postgresql' });

      // Disallow multi-statement batches
      if (Array.isArray(ast) && ast.length > 1) {
        throw new Error('Multiple SQL statements are not permitted in assessment queries.');
      }

      const singleAst = Array.isArray(ast) ? ast[0] : ast;

      // Only SELECT statements are permitted
      if (singleAst.type !== 'select') {
        throw new Error(`Forbidden statement type '${singleAst.type}'. Only analytical SELECT statements are allowed.`);
      }

      return true;
    } catch (err: any) {
      // Fallback regex guard if custom dialect syntax trips the parser
      const upper = query.toUpperCase();
      const forbidden = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'EXEC', 'CREATE', 'REPLACE'];
      for (const word of forbidden) {
        if (new RegExp(`\\b${word}\\b`).test(upper)) {
          throw new Error(`Forbidden analytical statement: ${word}. Queries must be read-only SELECT expressions.`);
        }
      }
      return true;
    }
  }
}
