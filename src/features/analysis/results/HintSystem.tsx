"use client";

import React from 'react';
import { HelpCircle, Lock, Copy } from 'lucide-react';
import type { HintDef } from '@/shared/types/content';

interface Props {
  /** Every hint's title (the text stays on the server until revealed). */
  titles: { title: string }[];
  /** Hints the server has revealed on this attempt, in order. */
  revealed: HintDef[];
  onReveal: (index: number) => void;
  busy?: boolean;
  error?: string | null;
  onInsertSnippet: (code: string) => void;
}

/** Tiered hints, revealed in order through the server. Each one costs independence points and 8% of the pay. */
export const HintSystem: React.FC<Props> = ({ titles, revealed, onReveal, busy, error, onInsertSnippet }) => (
  <div className="p-6 overflow-y-auto space-y-4">
    <div className="flex items-center gap-2">
      <HelpCircle className="w-5 h-5 text-bgap-gold" />
      <h2 className="text-base font-bold text-bgap-text">Hints</h2>
    </div>
    <p className="text-xs text-bgap-muted">Each hint you open costs 3 independence points and 8% of the pay. They unlock in order, and your client keeps count.</p>
    {error && <p className="text-xs text-red-400">{error}</p>}

    {titles.map((t, i) => {
      const h = revealed[i];
      const next = i === revealed.length;
      return (
        <div key={i} className="border border-bgap-border rounded-xl bg-bgap-card overflow-hidden">
          <div className="p-3.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-bgap-text">{t.title}</span>
            {!h && (
              <button
                onClick={() => onReveal(i)}
                disabled={!next || busy}
                className="text-[11px] px-2.5 py-1 rounded-lg border border-bgap-border text-bgap-muted enabled:hover:text-bgap-text enabled:hover:border-bgap-gold disabled:opacity-40 inline-flex items-center gap-1"
              >
                <Lock className="w-3 h-3" /> {next ? (busy ? 'Opening…' : 'Reveal') : 'Locked'}
              </button>
            )}
          </div>
          {h && (
            <div className="p-3.5 border-t border-bgap-border text-xs text-bgap-muted bg-bgap-dark/40 space-y-3">
              <p>{h.desc}</p>
              {h.snippet && (
                <div className="relative">
                  <pre className="p-2.5 pr-9 rounded-lg bg-bgap-dark text-bgap-cyan font-mono text-[11px] overflow-x-auto">{h.snippet}</pre>
                  <button onClick={() => onInsertSnippet(h.snippet!)} aria-label="Insert into editor" className="absolute top-2 right-2 p-1 rounded bg-bgap-card text-bgap-muted hover:text-bgap-text">
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
