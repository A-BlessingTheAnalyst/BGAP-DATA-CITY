// First line of defence before Python code reaches Pyodide, mirroring SandboxRunner.ts's job
// for SQL. Pyodide itself already runs in a WASM sandbox with no filesystem or network access
// granted (see PythonGrader.ts — no micropip, no jsglobals exposed), so this is defence in depth
// and better player-facing errors, not the only thing standing between player code and the host.
//
// Known gap (masterprompt.md §15.4): there is no execution-time kill-switch here. DuckDB's SQL
// grader can call conn.interrupt() on a runaway query; a synchronous Pyodide runPython() call has
// no equivalent without running it in a worker_thread with a SharedArrayBuffer interrupt buffer,
// which isn't built yet. A player submission with a genuine infinite loop will hang the grading
// call. Don't treat this module as a full safety story until that's addressed.

const FORBIDDEN_IMPORTS = [
  'os', 'sys', 'subprocess', 'socket', 'shutil', 'pathlib', 'importlib', 'ctypes',
  'multiprocessing', 'threading', 'asyncio', 'urllib', 'http', 'ftplib', 'telnetlib',
  'pickle', 'marshal', 'shelve', 'tempfile', 'glob', 'sqlite3', 'resource', 'signal',
];
const FORBIDDEN_CALLS = ['eval', 'exec', 'compile', '__import__', 'open', 'input', 'exit', 'quit', 'vars', 'globals()'];
// Classic sandbox-escape idioms (reaching the base object via __class__/__bases__/__subclasses__
// chains to get at otherwise-unreachable builtins).
const FORBIDDEN_PATTERNS = [/__class__/, /__bases__/, /__subclasses__/, /__globals__/, /__builtins__/, /__mro__/];

export class PythonSandboxRunner {
  static readonly MAX_LENGTH = 6000;

  /** Throws a player-readable error if the code trips an obvious guard. Not a full parser — a
   * keyword/pattern check, same spirit as SandboxRunner's SQL keyword blocklist. */
  static enforceConstraints(code: string): true {
    const src = (code ?? '').trim();
    if (!src) throw new Error('Your code is empty.');
    if (src.length > this.MAX_LENGTH) throw new Error(`Code is limited to ${this.MAX_LENGTH} characters.`);

    // Strip comments and string literals before keyword checks so a forbidden word inside a
    // string or comment (e.g. a docstring mentioning "import os") doesn't false-positive.
    const stripped = src
      .replace(/#[^\n]*/g, ' ')
      .replace(/("""[\s\S]*?"""|'''[\s\S]*?''')/g, ' ')
      .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, ' ');

    for (const mod of FORBIDDEN_IMPORTS) {
      if (new RegExp(`\\bimport\\s+${mod}\\b|\\bfrom\\s+${mod}\\b`).test(stripped)) {
        throw new Error(`"${mod}" isn't allowed. Work only with the data you're given.`);
      }
    }
    for (const fn of FORBIDDEN_CALLS) {
      if (new RegExp(`\\b${fn.replace('()', '')}\\s*\\(`).test(stripped)) {
        throw new Error(`"${fn}" isn't allowed.`);
      }
    }
    for (const pat of FORBIDDEN_PATTERNS) {
      if (pat.test(stripped)) throw new Error('That kind of introspection isn\'t allowed.');
    }
    return true;
  }
}
