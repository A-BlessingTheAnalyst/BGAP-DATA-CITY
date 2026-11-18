import fs from 'node:fs';
import path from 'node:path';

// Development persistence: small JSON files under .data/ (gitignored), written one at a time.
// DATA_CITY_DATA_DIR overrides the folder (tests point it at a temp dir).

export const dataDir = () => process.env.DATA_CITY_DATA_DIR || path.join(process.cwd(), '.data');

export function jsonFile<T>(name: string) {
  const file = () => path.join(dataDir(), name);
  let queue: Promise<unknown> = Promise.resolve();
  return {
    read(): T[] {
      const f = file();
      return fs.existsSync(f) ? (JSON.parse(fs.readFileSync(f, 'utf8')) as T[]) : [];
    },
    /** Runs `fn` on the current rows and saves what it returns, serialised so writes never interleave. */
    update<R>(fn: (rows: T[]) => { rows: T[]; result: R }): Promise<R> {
      const run = () => {
        const { rows, result } = fn(this.read());
        fs.mkdirSync(path.dirname(file()), { recursive: true });
        fs.writeFileSync(file(), JSON.stringify(rows, null, 1));
        return result;
      };
      const next = queue.then(run, run);
      queue = next.catch(() => undefined);
      return next;
    },
  };
}
