"use client";

import React from 'react';
import { Clock } from 'lucide-react';

interface Props {
  history: string[];
  onSelect: (query: string) => void;
}

export const QueryHistory: React.FC<Props> = ({ history, onSelect }) => {
  return (
    <div className="p-4">
      <h3 className="text-xs font-mono text-bgap-cyan uppercase font-bold mb-3 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        Executed Queries
      </h3>
      {history.length === 0 ? (
        <p className="text-xs text-bgap-muted">No queries run yet in this session.</p>
      ) : (
        <div className="space-y-2">
          {history.map((q, i) => (
            <button
              key={i}
              onClick={() => onSelect(q)}
              className="w-full text-left p-2.5 rounded-lg bg-bgap-card border border-bgap-border text-xs font-mono text-bgap-text truncate hover:border-bgap-cyan transition"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
