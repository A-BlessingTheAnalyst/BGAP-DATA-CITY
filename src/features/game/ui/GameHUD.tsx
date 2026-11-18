"use client";

import React, { useState } from 'react';
import { Minimap, DistrictBanner } from './Minimap';
import { CityMap } from './map/CityMap';
import { CharacterCreator } from './wardrobe/CharacterCreator';
import { TailorShop } from './wardrobe/TailorShop';
import { loadWardrobe } from './wardrobe/useWardrobe';
import { MissionTrackerHUD } from '../missions/MissionTrackerHUD';
import { PauseMenu } from './PauseMenu';
import { SettingsModal } from './SettingsModal';
import { MobileTouchControls } from '../input/MobileTouchControls';
import { useGameState } from '../engine/GameState';
import { Volume2, VolumeX, Menu, Shield, Smartphone } from 'lucide-react';
import { DataPhone } from './phone/DataPhone';
import { loadMissions, naira, refreshWallet, useCareerBootstrap, useCareerStore } from './phone/useCareer';
import { overallReputation } from '@/shared/reputation';

export const GameHUD: React.FC = () => {
  const isMuted = useGameState((s) => s.isMuted);
  const toggleMute = useGameState((s) => s.toggleMute);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const balance = useGameState((s) => s.walletBalance);
  const completedIds = useGameState((s) => s.completedMissions);
  const completed = completedIds.length;
  const missions = useCareerStore((s) => s.missions);
  const rank = overallReputation(missions ?? [], completedIds).rank;
  const isPhoneOpen = useGameState((s) => s.isPhoneOpen);
  const setPhoneOpen = useGameState((s) => s.setPhoneOpen);
  useCareerBootstrap();
  React.useEffect(() => { loadWardrobe(); }, []);

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden">
      {/* Top Left Profile Status & Minimap */}
      <div className="absolute top-5 left-5 flex flex-col sm:flex-row items-start gap-2 sm:gap-4 pointer-events-auto">
        <Minimap />
        <div className="bg-bgap-surface/85 backdrop-blur-md border border-bgap-border rounded-xl p-3 shadow-hud-glass text-xs">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-bgap-emerald" />
            <span className="font-bold text-bgap-text">{rank}</span>
            <span className="px-1.5 py-0.5 bg-bgap-emerald/20 text-bgap-emerald rounded font-mono font-bold">
              {completed} {completed === 1 ? 'job' : 'jobs'} done
            </span>
          </div>
          <div className="font-mono text-sm text-bgap-gold tabular-nums">{balance === null ? '₦…' : naira(balance)}</div>
          <div className="text-[10px] text-bgap-muted mt-0.5">Tab · DataPhone &nbsp;·&nbsp; M · Map</div>
        </div>
      </div>

      {/* Top Right Mission Tracker */}
      <MissionTrackerHUD />

      {/* Floating Control Buttons */}
      <div className="absolute bottom-5 right-5 flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => { if (!isPhoneOpen) { loadMissions(); refreshWallet(); } setPhoneOpen(!isPhoneOpen); }}
          aria-label="DataPhone"
          className={`w-10 h-10 rounded-xl bg-bgap-surface/80 border flex items-center justify-center transition ${isPhoneOpen ? 'border-bgap-cyan text-bgap-cyan' : 'border-bgap-border text-bgap-muted hover:text-bgap-text'}`}
        >
          <Smartphone className="w-5 h-5" />
        </button>
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

      <DistrictBanner />
      <DataPhone />
      <CityMap />
      <TailorShop />
      <CharacterCreator />

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
