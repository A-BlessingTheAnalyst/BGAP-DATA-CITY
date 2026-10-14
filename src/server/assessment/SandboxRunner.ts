export class SandboxRunner {
  static readonly TIMEOUT_MS = 3000;
  static readonly MAX_ROWS = 500;

  static enforceConstraints(query: string) {
    const forbidden = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'EXEC'];
    const uppercase = query.toUpperCase();

    for (const word of forbidden) {
      if (uppercase.includes(word)) {
        throw new Error(`Forbidden analytical statement: ${word}. Queries must be read-only SELECT expressions.`);
      }
    }
    return true;
  }
}
