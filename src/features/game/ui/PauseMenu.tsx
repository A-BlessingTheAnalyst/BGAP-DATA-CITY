"use client";

import React from 'react';
import Link from 'next/link';
import { Play, Settings, Compass, BookOpen, LogOut } from 'lucide-react';

interface Props {
  onClose: () => void;
  onOpenSettings: () => void;
}

export const PauseMenu: React.FC<Props> = ({ onClose, onOpenSettings }) => {
  return (
    <div className="fixed inset-0 bg-bgap-dark/80 backdrop-blur-md flex items-center justify-center z-50 pointer-events-auto">
      <div className="w-full max-w-sm bg-bgap-surface border border-bgap-border rounded-2xl p-6 shadow-hud-glass">
        <h2 className="text-xl font-bold text-bgap-text text-center mb-6">Game Menu</h2>

        <div className="space-y-3">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-bgap-cyan to-bgap-neon text-bgap-dark font-bold flex items-center justify-center gap-2 hover:opacity-90 transition"
          >
            <Play className="w-4 h-4 fill-current" />
            Resume Adventure
          </button>

          <Link
            href="/game/missions"
            className="w-full py-3 rounded-xl bg-bgap-card border border-bgap-border text-bgap-text font-semibold flex items-center justify-center gap-2 hover:bg-bgap-border/50 transition"
          >
            <Compass className="w-4 h-4 text-bgap-gold" />
            Missions Log
          </Link>

          <button
            onClick={onOpenSettings}
            className="w-full py-3 rounded-xl bg-bgap-card border border-bgap-border text-bgap-text font-semibold flex items-center justify-center gap-2 hover:bg-bgap-border/50 transition"
          >
            <Settings className="w-4 h-4 text-bgap-cyan" />
            Graphics & Audio
          </button>

          <Link
            href="/learn"
            className="w-full py-3 rounded-xl bg-bgap-card border border-bgap-border text-bgap-text font-semibold flex items-center justify-center gap-2 hover:bg-bgap-border/50 transition"
          >
            <BookOpen className="w-4 h-4 text-bgap-emerald" />
            BGAP Academy
          </Link>

          <Link
            href="/dashboard"
            className="w-full py-3 rounded-xl text-bgap-muted hover:text-red-400 font-semibold flex items-center justify-center gap-2 transition"
          >
            <LogOut className="w-4 h-4" />
            Exit to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
