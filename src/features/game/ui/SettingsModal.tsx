"use client";

import React from 'react';
import { useGameState } from '../engine/GameState';
import { GraphicsQuality } from '@/shared/types/game';
import { X, Monitor, Volume2 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ onClose }) => {
  const quality = useGameState((s) => s.graphicsQuality);
  const setQuality = useGameState((s) => s.setGraphicsQuality);
  const isMuted = useGameState((s) => s.isMuted);
  const toggleMute = useGameState((s) => s.toggleMute);

  return (
    <div className="fixed inset-0 bg-bgap-dark/80 backdrop-blur-md flex items-center justify-center z-50 pointer-events-auto">
      <div className="w-full max-w-md bg-bgap-surface border border-bgap-border rounded-2xl p-6 shadow-hud-glass">
        <div className="flex items-center justify-between pb-4 border-b border-bgap-border mb-6">
          <h2 className="text-lg font-bold text-bgap-text flex items-center gap-2">
            <Monitor className="w-5 h-5 text-bgap-cyan" />
            Game Configuration
          </h2>
          <button onClick={onClose} className="text-bgap-muted hover:text-bgap-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Graphics Quality */}
        <div className="mb-6">
          <label className="text-xs font-mono text-bgap-cyan uppercase font-bold tracking-wider block mb-2">
            Graphics Quality Profile
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'balanced', 'high'] as GraphicsQuality[]).map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={`py-2.5 rounded-xl border font-mono text-xs uppercase font-bold transition ${
                  quality === q
                    ? 'bg-bgap-cyan/20 border-bgap-cyan text-bgap-cyan shadow-neon-cyan'
                    : 'bg-bgap-card border-bgap-border text-bgap-muted hover:text-bgap-text'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Audio Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-bgap-card border border-bgap-border mb-6">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-bgap-emerald" />
            <span className="text-sm font-medium text-bgap-text">Sound & Audio FX</span>
          </div>
          <button
            onClick={toggleMute}
            className={`px-3 py-1 rounded-lg text-xs font-bold ${
              isMuted ? 'bg-red-500/20 text-red-400' : 'bg-bgap-emerald/20 text-bgap-emerald'
            }`}
          >
            {isMuted ? 'MUTED' : 'ENABLED'}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-bgap-card border border-bgap-border hover:bg-bgap-border/60 text-bgap-text font-bold transition"
        >
          Save & Return
        </button>
      </div>
    </div>
  );
};
