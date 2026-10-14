"use client";

import React from 'react';
import { QueryResult } from '@/shared/types/analysis';
import { formatCurrency } from '@/shared/utils/formatting';

interface Props {
  result: QueryResult | null;
}

export const ResultTable: React.FC<Props> = ({ result }) => {
  if (!result || result.rows.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center p-6 text-bgap-muted text-xs">
        Execute your SQL query to inspect returned result sets here.
      </div>
    );
  }

  return (
    <div className="border border-bgap-border rounded-xl overflow-hidden bg-bgap-card/30">
      <table className="w-full text-left text-xs font-mono">
        <thead className="bg-bgap-card text-bgap-muted border-b border-bgap-border">
          <tr>
            {result.columns.map((c) => (
              <th key={c.name} className="py-2.5 px-3">
                {c.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-bgap-border/40 text-bgap-text">
          {result.rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-bgap-card/60 transition">
              {result.columns.map((c) => {
                const val = row[c.name];
                const display =
                  typeof val === 'number' && c.name.toLowerCase().includes('revenue')
                    ? formatCurrency(val)
                    : String(val);

                return (
                  <td key={c.name} className="py-2.5 px-3">
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
