// DuckDB Web Worker RPC Bridge
self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'INIT') {
    // Initialized signal
    self.postMessage({ type: 'INIT_SUCCESS' });
  }

  if (type === 'QUERY') {
    // Simulated fast worker query execution for client-side practice
    const startTime = performance.now();
    self.postMessage({
      type: 'QUERY_SUCCESS',
      payload: {
        columns: [
          { name: 'sale_date', type: 'DATE' },
          { name: 'revenue', type: 'DOUBLE' },
        ],
        rows: [
          { sale_date: '2026-10-01', revenue: 148500 },
          { sale_date: '2026-10-02', revenue: 126000 },
          { sale_date: '2026-10-03', revenue: 91250 },
        ],
        rowCount: 3,
        executionTimeMs: Math.round(performance.now() - startTime),
      },
    });
  }
};
