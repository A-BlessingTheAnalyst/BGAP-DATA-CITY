import { useState, useCallback } from 'react';
import { QueryResult } from '@/shared/types/analysis';
import { CAFE_SAMPLE_SALES } from '../missions/chapter1-cafe/CafeTestData';

export function useDuckDb() {
  const [isRunning, setIsRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runQuery = useCallback(async (sql: string) => {
    setIsRunning(true);
    setError(null);
    const start = performance.now();

    try {
      // Local client-side simulation evaluating query against CAFE_SAMPLE_SALES
      const cleaned = sql.toLowerCase();
      const includesCompletedOnly =
        cleaned.includes("payment_status = 'completed'") ||
        cleaned.includes('payment_status=\'completed\'');

      let filtered = CAFE_SAMPLE_SALES;
      if (includesCompletedOnly) {
        filtered = filtered.filter((s) => s.payment_status === 'completed');
      }

      // Group by date
      const dateMap: Record<string, number> = {};
      filtered.forEach((row) => {
        const d = row.sale_at.split(' ')[0];
        dateMap[d] = (dateMap[d] || 0) + row.quantity * row.unit_price;
      });

      const rows = Object.entries(dateMap).map(([sale_date, revenue]) => ({
        sale_date,
        revenue,
      }));

      const elapsed = Math.round(performance.now() - start);

      setQueryResult({
        columns: [
          { name: 'sale_date', type: 'DATE' },
          { name: 'revenue', type: 'NUMERIC' },
        ],
        rows,
        rowCount: rows.length,
        executionTimeMs: elapsed,
      });
    } catch (err: any) {
      setError(err?.message || 'Query execution error');
    } finally {
      setIsRunning(false);
    }
  }, []);

  return { runQuery, queryResult, isRunning, error };
}
