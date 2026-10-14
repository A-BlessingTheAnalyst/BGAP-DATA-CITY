"use client";

import React from 'react';
import { QueryResult } from '@/shared/types/analysis';
import { CheckCircle, AlertCircle, Clock, Hash } from 'lucide-react';

interface Props {
  result: QueryResult | null;
  error?: string | null;
  isRunning?: boolean;
}

export const QueryMetrics: React.FC<Props> = ({ result, error, isRunning }) => {
  return (
    <div className="h-10 border-b border-bgap-border bg-bgap-surface px-4 flex items-center justify-between text-xs font-mono">
      <div className="flex items-center gap-3">
        {isRunning ? (
          <span className="text-bgap-cyan flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-bgap-cyan animate-ping" />
            Executing...
          </span>
        ) : error ? (
          <span className="text-red-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            Query Failed
          </span>
        ) : result ? (
          <span className="text-bgap-emerald flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            Query Succeeded
          </span>
        ) : (
          <span className="text-bgap-muted">Ready</span>
        )}
      </div>

      {result && !isRunning && (
        <div className="flex items-center gap-4 text-bgap-muted">
          <span className="flex items-center gap-1">
            <Hash className="w-3 h-3 text-bgap-cyan" />
            {result.rowCount} rows
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-bgap-gold" />
            {result.executionTimeMs} ms
          </span>
        </div>
      )}
    </div>
  );
};
