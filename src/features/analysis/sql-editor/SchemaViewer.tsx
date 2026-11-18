"use client";

import React from 'react';
import { Table, Key } from 'lucide-react';
import type { Row, TableDef } from '@/shared/types/content';

/** Tables for the open case: columns, types, meanings, and a few sample rows. */
export const SchemaViewer: React.FC<{ tables: TableDef[]; data: Record<string, Row[]> }> = ({ tables, data }) => (
  <div className="p-6 overflow-y-auto space-y-8">
    {tables.map((t) => {
      const sample = (data[t.name] ?? []).slice(0, 5);
      return (
        <section key={t.name}>
          <div className="flex items-center gap-2 mb-1">
            <Table className="w-5 h-5 text-bgap-cyan" />
            <h2 className="text-base font-bold text-bgap-text font-mono">{t.name}</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-bgap-card text-bgap-muted border border-bgap-border">{(data[t.name] ?? []).length} rows</span>
          </div>
          <p className="text-xs text-bgap-muted mb-4">{t.description}</p>
          <div className="border border-bgap-border rounded-xl overflow-hidden mb-3">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-bgap-card text-bgap-muted border-b border-bgap-border">
                <tr><th className="py-2 px-3">Column</th><th className="py-2 px-3">Type</th><th className="py-2 px-3">Meaning</th></tr>
              </thead>
              <tbody className="divide-y divide-bgap-border/50 text-bgap-text">
                {t.columns.map((c) => (
                  <tr key={c.name}>
                    <td className="py-2 px-3 font-semibold text-bgap-cyan"><span className="inline-flex items-center gap-1.5">{c.pk && <Key className="w-3 h-3 text-bgap-gold" />}{c.name}</span></td>
                    <td className="py-2 px-3 text-bgap-muted">{c.type}</td>
                    <td className="py-2 px-3 text-bgap-text/80 font-sans">{c.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sample.length > 0 && (
            <div className="overflow-x-auto border border-bgap-border rounded-xl">
              <table className="w-full text-left text-[11px] font-mono">
                <thead className="bg-bgap-card text-bgap-muted"><tr>{t.columns.map((c) => <th key={c.name} className="py-1.5 px-2 whitespace-nowrap">{c.name}</th>)}</tr></thead>
                <tbody className="divide-y divide-bgap-border/40 text-bgap-text/90">
                  {sample.map((r, i) => <tr key={i}>{t.columns.map((c) => <td key={c.name} className="py-1.5 px-2 whitespace-nowrap">{r[c.name] === null ? '∅' : String(r[c.name])}</td>)}</tr>)}
                </tbody>
              </table>
            </div>
          )}
        </section>
      );
    })}
  </div>
);
