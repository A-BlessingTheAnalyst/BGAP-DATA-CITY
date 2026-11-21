"use client";

import React from 'react';
import { useGameState } from '../engine/GameState';
import { GraphicsQuality } from '@/shared/types/game';
import { X, Monitor, Volume2, Eye, Type, Wind, LayoutDashboard, Target, Lightbulb } from 'lucide-react';
import { useHudPrefs } from './hudPrefs';

interface Props {
  onClose: () => void;
}

function Toggle({ icon: Icon, label, hint, on, onClick, colorOn = 'text-bgap-emerald bg-bgap-emerald/20' }: {
  icon: typeof Eye; label: string; hint: string; on: boolean; onClick: () => void; colorOn?: string;
}) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl bg-bgap-card border border-bgap-border mb-3">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="w-4 h-4 text-bgap-cyan shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-medium text-bgap-text">{label}</div>
          <div className="text-[11px] text-bgap-muted">{hint}</div>
        </div>
      </div>
      <button onClick={onClick} aria-pressed={on} className={`shrink-0 px-3 py-1 rounded-lg text-xs font-bold ${on ? colorOn : 'bg-bgap-border/40 text-bgap-muted'}`}>
        {on ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}

export const SettingsModal: React.FC<Props> = ({ onClose }) => {
  const quality = useGameState((s) => s.graphicsQuality);
  const setQuality = useGameState((s) => s.setGraphicsQuality);
  const hud = useHudPrefs();
  const isMuted = useGameState((s) => s.isMuted);
  const toggleMute = useGameState((s) => s.toggleMute);
  const { reducedMotion, largeText, colorblindSafe, setAccessibility } = useGameState((s) => ({
    reducedMotion: s.reducedMotion, largeText: s.largeText, colorblindSafe: s.colorblindSafe, setAccessibility: s.setAccessibility,
  }));

  return (
    <div className="fixed inset-0 bg-bgap-dark/80 backdrop-blur-md flex items-center justify-center z-50 pointer-events-auto overflow-y-auto py-8">
      <div className="w-full max-w-md bg-bgap-surface border border-bgap-border rounded-2xl p-6 shadow-hud-glass my-auto">
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
        <Toggle icon={Volume2} label="Sound & Audio FX" hint="Footsteps, UI sounds, the city's ambient soundscape" on={!isMuted} onClick={toggleMute} />

        {/* Screen layout */}
        <label className="text-xs font-mono text-bgap-cyan uppercase font-bold tracking-wider block mb-2 mt-5">Screen</label>
        <Toggle icon={LayoutDashboard} label="Show HUD" hint="Status, buttons and tracker (H). The map always stays." on={hud.hudVisible} onClick={() => hud.set({ hudVisible: !hud.hudVisible })} />
        <Toggle icon={Target} label="Mission tracker" hint="The one-line job pill under the status bar" on={hud.showTracker} onClick={() => hud.set({ showTracker: !hud.showTracker })} />
        <Toggle icon={Lightbulb} label="Guidance tips" hint="Short one-time popups explaining controls" on={hud.showTips} onClick={() => hud.set({ showTips: !hud.showTips })} />

        {/* Accessibility */}
        <label className="text-xs font-mono text-bgap-cyan uppercase font-bold tracking-wider block mb-2 mt-5">Accessibility</label>
        <Toggle icon={Type} label="Large text" hint="Scales every menu and HUD label up" on={largeText} onClick={() => setAccessibility({ largeText: !largeText })} />
        <Toggle icon={Wind} label="Reduced motion" hint="Turns off camera auto-spin and pulsing animations" on={reducedMotion} onClick={() => setAccessibility({ reducedMotion: !reducedMotion })} />
        <Toggle icon={Eye} label="Colour-blind-safe traffic lights" hint="Blue for go, orange for stop, instead of green/red" on={colorblindSafe} onClick={() => setAccessibility({ colorblindSafe: !colorblindSafe })} />

        <button
          onClick={onClose}
          className="w-full mt-3 py-3 rounded-xl bg-bgap-card border border-bgap-border hover:bg-bgap-border/60 text-bgap-text font-bold transition"
        >
          Save & Return
        </button>
      </div>
    </div>
  );
};
