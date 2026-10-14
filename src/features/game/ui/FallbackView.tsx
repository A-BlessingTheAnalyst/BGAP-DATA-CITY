"use client";

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Terminal, BookOpen } from 'lucide-react';

export const FallbackView: React.FC = () => {
  return (
    <div className="min-h-screen bg-bgap-dark text-bgap-text flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-bgap-surface border border-bgap-border rounded-2xl p-8 text-center shadow-hud-glass">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>

        <h2 className="text-2xl font-bold mb-2">WebGL Unavailable</h2>
        <p className="text-sm text-bgap-muted leading-relaxed mb-6">
          Your browser or device does not support hardware-accelerated 3D WebGL rendering. You can still complete all data analytics missions using the lightweight interactive web terminal!
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/game/missions"
            className="py-3 px-6 rounded-xl bg-gradient-to-r from-bgap-cyan to-bgap-neon text-bgap-dark font-bold flex items-center justify-center gap-2 hover:opacity-90"
          >
            <Terminal className="w-4 h-4" />
            Open 2D Analytics Terminal
          </Link>
          <Link
            href="/dashboard"
            className="py-3 px-6 rounded-xl bg-bgap-card border border-bgap-border text-bgap-text font-semibold flex items-center justify-center gap-2 hover:bg-bgap-border/50"
          >
            <BookOpen className="w-4 h-4" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
