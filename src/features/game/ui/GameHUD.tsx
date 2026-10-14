"use client";

import React, { useState } from 'react';
import { Minimap } from './Minimap';
import { MissionTrackerHUD } from '../missions/MissionTrackerHUD';
import { PauseMenu } from './PauseMenu';
import { SettingsModal } from './SettingsModal';
import { MobileTouchControls } from '../input/MobileTouchControls';
import { useGameState } from '../engine/GameState';
import { Volume2, VolumeX, Menu, Shield } from 'lucide-react';

export const GameHUD: React.FC = () => {
  const isMuted = useGameState((s) => s.isMuted);
  const toggleMute = useGameState((s) => s.toggleMute);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden">
      {/* Top Left Profile Status & Minimap */}
      <div className="absolute top-5 left-5 flex items-start gap-4 pointer-events-auto">
        <Minimap />
        <div className="bg-bgap-surface/85 backdrop-blur-md border border-bgap-border rounded-xl p-3 shadow-hud-glass text-xs">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-bgap-emerald" />
            <span className="font-bold text-bgap-text">Cadet Analyst</span>
            <span className="px-1.5 py-0.2 bg-bgap-emerald/20 text-bgap-emerald rounded font-mono font-bold">
              LVL 1
            </span>
          </div>
          <div className="w-32 bg-bgap-card h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-bgap-cyan to-bgap-emerald h-full w-[45%]" />
          </div>
        </div>
      </div>

      {/* Top Right Mission Tracker */}
      <MissionTrackerHUD />

      {/* Floating Control Buttons */}
      <div className="absolute bottom-5 right-5 flex items-center gap-2 pointer-events-auto">
        <button
          onClick={toggleMute}
          className="w-10 h-10 rounded-xl bg-bgap-surface/80 border border-bgap-border text-bgap-muted hover:text-bgap-text flex items-center justify-center transition"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
        </button>
        <button
          onClick={() => setShowPauseMenu(true)}
          className="w-10 h-10 rounded-xl bg-bgap-surface/80 border border-bgap-border text-bgap-muted hover:text-bgap-text flex items-center justify-center transition"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Touch Controls Overlay */}
      <MobileTouchControls />

      {/* Modals */}
      {showPauseMenu && (
        <PauseMenu
          onClose={() => setShowPauseMenu(false)}
          onOpenSettings={() => {
            setShowPauseMenu(false);
            setShowSettings(true);
          }}
        />
      )}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};
