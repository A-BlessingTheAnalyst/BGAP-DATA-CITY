import { useState, useCallback, useEffect, useRef } from 'react';
import { QueryResult, ColumnMeta } from '@/shared/types/analysis';
import type { PublicMissionDetail } from '@/shared/types/content';

// In-browser DuckDB-Wasm for practice queries. One database per page; each mission's visible
// tables are (re)created when the terminal opens it. If DuckDB can't start, the terminal shows
// the error: results are never invented. Official grading always happens on the server.

type Conn = { query: (sql: string) => Promise<any>; close: () => Promise<void> };
let connPromise: Promise<Conn> | null = null;

/** Self-hosted bundles, copied into public/duckdb by scripts/copy-duckdb.mjs (works offline). */
const LOCAL_BUNDLES = {
  mvp: { mainModule: '/duckdb/duckdb-mvp.wasm', mainWorker: '/duckdb/duckdb-browser-mvp.worker.js' },
  eh: { mainModule: '/duckdb/duckdb-eh.wasm', mainWorker: '/duckdb/duckdb-browser-eh.worker.js' },
};

async function open(duckdb: typeof import('@duckdb/duckdb-wasm'), bundles: Parameters<typeof duckdb.selectBundle>[0]): Promise<Conn> {
  const bundle = await duckdb.selectBundle(bundles);
  // A same-origin worker loads directly; a CDN worker needs a blob wrapper to get past the origin rule.
  const crossOrigin = /^https?:/.test(bundle.mainWorker!) && new URL(bundle.mainWorker!).origin !== window.location.origin;
  const workerUrl = crossOrigin ? URL.createObjectURL(new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })) : bundle.mainWorker!;
  const worker = new Worker(workerUrl);
  try {
    const db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
    return (await db.connect()) as unknown as Conn;
  } catch (e) {
    worker.terminate();
    throw e;
  } finally {
    if (crossOrigin) URL.revokeObjectURL(workerUrl);
  }
}

async function getConnection(): Promise<Conn> {
  connPromise ??= (async () => {
    const duckdb = await import('@duckdb/duckdb-wasm');
    try {
      return await open(duckdb, LOCAL_BUNDLES);
    } catch (local) {
      // Local bundles missing (e.g. a deploy that skipped the copy step): fall back to the CDN.
      console.warn('[duckdb] self-hosted bundle failed, trying jsDelivr:', local);
      return open(duckdb, duckdb.getJsDelivrBundles());
    }
  })();
  try {
    return await connPromise;
  } catch (e) {
    connPromise = null; // allow a retry
    throw e;
  }
}

const literal = (v: unknown) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);

async function loadMission(conn: Conn, mission: PublicMissionDetail) {
  for (const t of mission.tables) {
    await conn.query(`DROP TABLE IF EXISTS ${t.name}`);
    await conn.query(`CREATE TABLE ${t.name} (${t.columns.map((c) => `${c.name} ${c.type}`).join(', ')})`);
    const rows = mission.data[t.name] ?? [];
    if (rows.length) await conn.query(`INSERT INTO ${t.name} VALUES ${rows.map((r) => `(${t.columns.map((c) => literal(r[c.name])).join(', ')})`).join(', ')}`);
  }
}

/** Arrow hands DATE/TIMESTAMP values back as epoch milliseconds; show them the way SQL prints them. */
const plain = (v: unknown, type = ''): unknown => {
  if (v === null || v === undefined) return v;
  const t = type.toLowerCase();
  const asDate = (ms: number) => new Date(ms).toISOString();
  if (t.startsWith('date') && (typeof v === 'number' || typeof v === 'bigint')) {
    const n = Number(v);
    return asDate(Math.abs(n) < 1e7 ? n * 86_400_000 : n).slice(0, 10); // days or milliseconds
  }
  if (t.startsWith('timestamp') && (typeof v === 'number' || typeof v === 'bigint')) {
    const n = Number(v);
    // Units vary by Arrow version; judge by size (seconds ~1e9, ms ~1e12, µs ~1e15, ns ~1e18).
    const a = Math.abs(n);
    const ms = a > 1e17 ? n / 1e6 : a > 1e14 ? n / 1e3 : a < 1e11 ? n * 1e3 : n;
    return asDate(ms).replace('T', ' ').replace(/\.000Z$/, '').replace('Z', '');
  }
  if (typeof v === 'bigint') return Number(v);
  if (v instanceof Date) return v.toISOString().replace('T', ' ').replace('.000Z', '');
  return v;
};

export function useDuckDb(mission: PublicMissionDetail | null) {
  const [isRunning, setIsRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const loaded = useRef<string | null>(null);

  useEffect(() => {
    if (!mission || loaded.current === mission.id) return;
    let cancelled = false;
    setReady(false);
    getConnection()
      .then((conn) => loadMission(conn, mission))
      .then(() => { if (!cancelled) { loaded.current = mission.id; setReady(true); setQueryResult(null); setError(null); } })
      .catch((e) => { if (!cancelled) setError(`The practice database couldn't start: ${e?.message ?? e}. Check your connection and reopen the terminal.`); });
    return () => { cancelled = true; };
  }, [mission]);

  const runQuery = useCallback(async (sql: string) => {
    setIsRunning(true);
    setError(null);
    const start = performance.now();
    try {
      if (!sql.trim()) throw new Error('Type a SQL query to run.');
      if (!mission) throw new Error('No case is open.');
      const conn = await getConnection();
      if (loaded.current !== mission.id) { await loadMission(conn, mission); loaded.current = mission.id; }
      const table = await conn.query(sql);
      const columns: ColumnMeta[] = table.schema.fields.map((f: any) => ({ name: f.name, type: String(f.type) }));
      const rows = table.toArray().slice(0, 500).map((r: any) => {
        const o = r.toJSON();
        for (const c of columns) o[c.name] = plain(o[c.name], c.type);
        return o;
      });
      setQueryResult({ columns, rows, rowCount: table.numRows, executionTimeMs: Math.round(performance.now() - start) });
    } catch (err: any) {
      setError(err?.message || 'Query error. Check your SQL syntax.');
    } finally {
      setIsRunning(false);
    }
  }, [mission]);

  return { runQuery, queryResult, isRunning, error, ready };
}
