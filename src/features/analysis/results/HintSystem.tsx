"use client";

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronRight, Copy } from 'lucide-react';

interface Props {
  onInsertSnippet: (code: string) => void;
}

export const HintSystem: React.FC<Props> = ({ onInsertSnippet }) => {
  const [revealed, setRevealed] = useState<number[]>([]);

  const hints = [
    {
      level: 1,
      title: 'Hint 1: Conceptual Understanding',
      desc: 'Not every row represents actual earned revenue. Some records indicate voided tickets (mistakes cancelled immediately) and refunded orders.',
    },
    {
      level: 2,
      title: 'Hint 2: SQL Filter Condition',
      desc: "Use a WHERE clause to restrict rows strictly to completed transactions: WHERE payment_status = 'completed'",
      snippet: "WHERE payment_status = 'completed'",
    },
    {
      level: 3,
      title: 'Hint 3: Full Query Structure',
      desc: 'Calculate the product of quantity and unit_price, sum them up, and group by the casted calendar date.',
      snippet:
        "SELECT CAST(sale_at AS DATE) AS sale_date,\n       SUM(quantity * unit_price) AS revenue\nFROM sales\nWHERE payment_status = 'completed'\nGROUP BY 1\nORDER BY 1;",
    },
  ];

  const toggleHint = (level: number) => {
    if (revealed.includes(level)) {
      setRevealed(revealed.filter((l) => l !== level));
    } else {
      setRevealed([...revealed, level]);
    }
  };

  return (
    <div className="p-6 overflow-y-auto space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <HelpCircle className="w-5 h-5 text-bgap-gold" />
        <h2 className="text-base font-bold text-bgap-text">Investigation Hints</h2>
      </div>
      <p className="text-xs text-bgap-muted mb-4">
        Hints help you progress without permanently stalling. Each hint gently points toward the analytical pattern.
      </p>

      {hints.map((h) => {
        const isShown = revealed.includes(h.level);
        return (
          <div key={h.level} className="border border-bgap-border rounded-xl bg-bgap-card overflow-hidden">
            <button
              onClick={() => toggleHint(h.level)}
              className="w-full p-3.5 flex items-center justify-between text-left hover:bg-bgap-border/40 transition"
            >
              <span className="text-xs font-semibold text-bgap-text">{h.title}</span>
              {isShown ? (
                <ChevronDown className="w-4 h-4 text-bgap-muted" />
              ) : (
                <ChevronRight className="w-4 h-4 text-bgap-muted" />
              )}
            </button>

            {isShown && (
              <div className="p-3.5 border-t border-bgap-border text-xs text-bgap-muted bg-bgap-dark/40 space-y-3">
                <p>{h.desc}</p>
                {h.snippet && (
                  <div className="relative">
                    <pre className="p-2.5 rounded-lg bg-bgap-dark text-bgap-cyan font-mono text-[11px] overflow-x-auto">
                      {h.snippet}
                    </pre>
                    <button
                      onClick={() => onInsertSnippet(h.snippet!)}
                      className="absolute top-2 right-2 p-1 rounded bg-bgap-card text-bgap-muted hover:text-bgap-text"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
