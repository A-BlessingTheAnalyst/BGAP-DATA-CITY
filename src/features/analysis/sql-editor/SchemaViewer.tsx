"use client";

import React from 'react';
import { Database, Table, Key } from 'lucide-react';

export const SchemaViewer: React.FC = () => {
  const schema = {
    tableName: 'sales',
    description: 'Café point-of-sale transaction ledger for October 2026',
    columns: [
      { name: 'id', type: 'INTEGER', desc: 'Unique transaction primary key', isPk: true },
      { name: 'transaction_code', type: 'VARCHAR(30)', desc: 'POS audit code (e.g., TX-1001)' },
      { name: 'sale_at', type: 'TIMESTAMP', desc: 'Date and time customer order was placed' },
      { name: 'item_name', type: 'VARCHAR(100)', desc: 'Product name or combo package' },
      { name: 'quantity', type: 'INTEGER', desc: 'Number of units ordered' },
      { name: 'unit_price', type: 'NUMERIC(10,2)', desc: 'Selling price per unit in Naira (₦)' },
      { name: 'payment_status', type: 'VARCHAR(20)', desc: 'Values: completed, refunded, voided' },
      { name: 'payment_method', type: 'VARCHAR(30)', desc: 'Values: pos_card, transfer, cash' },
    ],
  };

  return (
    <div className="p-6 overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <Table className="w-5 h-5 text-bgap-cyan" />
        <h2 className="text-base font-bold text-bgap-text font-mono">{schema.tableName}</h2>
        <span className="text-xs px-2 py-0.5 rounded bg-bgap-card text-bgap-muted border border-bgap-border">
          Table
        </span>
      </div>
      <p className="text-xs text-bgap-muted mb-6">{schema.description}</p>

      <div className="border border-bgap-border rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-bgap-card text-bgap-muted border-b border-bgap-border">
            <tr>
              <th className="py-2.5 px-3">Column</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bgap-border/50 text-bgap-text">
            {schema.columns.map((col) => (
              <tr key={col.name} className="hover:bg-bgap-card/40 transition">
                <td className="py-2.5 px-3 font-semibold text-bgap-cyan flex items-center gap-1.5">
                  {col.isPk && <Key className="w-3 h-3 text-bgap-gold" />}
                  <span>{col.name}</span>
                </td>
                <td className="py-2.5 px-3 text-bgap-muted">{col.type}</td>
                <td className="py-2.5 px-3 text-bgap-text/80">{col.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
