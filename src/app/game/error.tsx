"use client";

import React from 'react';
import Link from 'next/link';

export default function GameError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="w-screen h-screen bg-bgap-dark flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-bgap-surface border border-bgap-border rounded-2xl p-6 text-center">
        <h2 className="text-xl font-bold text-bgap-text mb-2">Simulation Encountered an Error</h2>
        <p className="text-xs text-bgap-muted mb-6">{error.message || 'Failed to render 3D district.'}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-bgap-cyan text-bgap-dark font-bold text-xs"
          >
            Retry Connection
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-bgap-card border border-bgap-border text-bgap-text font-semibold text-xs"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
