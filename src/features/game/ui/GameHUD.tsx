"use client";

import React, { useEffect, useState } from 'react';
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
import { Volume2, VolumeX, Menu, Smartphone, Eye, EyeOff } from 'lucide-react';
import { DataPhone } from './phone/DataPhone';
import { loadMissions, naira, refreshWallet, useCareerBootstrap, useCareerStore } from './phone/useCareer';
import { overallReputation } from '@/shared/reputation';
import { useHudPrefs, useIsTouch } from './hudPrefs';
import { Toasts, pushToast } from './Toasts';
import { Speedometer } from './Speedometer';
import { RotateDeviceGate } from './RotateDeviceGate';

// Owner feedback 21 Nov 2026: "too much information that cannot be toggled off, covering the whole
// screen". The HUD is now: the minimap (always), one small status chip and three icon buttons.
// The mission tracker is a one-line pill that expands on demand; key hints became one-time toasts;
// H (or the eye button) hides everything but the map.

const iconBtn = 'w-9 h-9 rounded-xl bg-bgap-surface/80 backdrop-blur border border-bgap-border text-bgap-muted hover:text-bgap-text flex items-center justify-center transition';

export const GameHUD: React.FC = () => {
  const isMuted = useGameState((s) => s.isMuted);
  const toggleMute = useGameState((s) => s.toggleMute);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const balance = useGameState((s) => s.walletBalance);
  const completedIds = useGameState((s) => s.completedMissions);
  const missions = useCareerStore((s) => s.missions);
  const rank = overallReputation(missions ?? [], completedIds).rank;
  const isPhoneOpen = useGameState((s) => s.isPhoneOpen);
  const setPhoneOpen = useGameState((s) => s.setPhoneOpen);
  const largeText = useGameState((s) => s.largeText);
  const fullscreenUi = useGameState((s) => s.isWorkstationActive || s.isCreatorOpen || s.isMapOpen);
  const hudVisible = useHudPrefs((s) => s.hudVisible);
  const setPrefs = useHudPrefs((s) => s.set);
  const touch = useIsTouch();

  useEffect(() => {
    // Accessibility: scales every rem-based Tailwind text size at once (opt-in, off by default).
    document.documentElement.style.fontSize = largeText ? '125%' : '';
  }, [largeText]);
  useCareerBootstrap();
  React.useEffect(() => { loadWardrobe(); }, []);

  // H toggles the HUD (the map always stays). Ignored while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest?.('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
      if (e.code === 'KeyH' && !e.repeat) {
        const next = !useHudPrefs.getState().hudVisible;
        setPrefs({ hudVisible: next });
        pushToast(next ? 'HUD on' : 'HUD hidden — press H to bring it back', { id: 'hud-toggle', ttl: 2200 });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setPrefs]);

  // One welcome tip with the essentials, instead of permanent key-hint text.
  useEffect(() => {
    const t = window.setTimeout(() => pushToast(
      touch ? 'Left stick to move · drag anywhere to look · tap the map for the full city' : 'WASD move · Shift run · E interact · Tab DataPhone · M map · H hide HUD',
      { id: touch ? 'tip:welcome-touch' : 'tip:welcome', once: true, ttl: 8000 },
    ), 2500);
    return () => window.clearTimeout(t);
  }, [touch]);

  const openPhone = () => { if (!isPhoneOpen) { loadMissions(); refreshWallet(); } setPhoneOpen(!isPhoneOpen); };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden hud-safe">
      {/* Top-left: the minimap, always. */}
      {!fullscreenUi && (
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 pointer-events-auto">
          <Minimap compact={!hudVisible} />
        </div>
      )}

      {/* Top-right: one compact status chip + icon buttons; the tracker pill sits under it. */}
      {!fullscreenUi && (
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex flex-col items-end gap-1.5 pointer-events-auto max-w-[min(70vw,340px)]">
          <div className="flex items-center gap-1.5">
            {hudVisible && (
              <div className="h-9 px-2.5 rounded-xl bg-bgap-surface/80 backdrop-blur border border-bgap-border flex items-center gap-2 text-[11px] leading-none">
                <span className="font-semibold text-bgap-text hidden sm:inline">{rank}</span>
                <span className="font-mono font-bold text-bgap-gold tabular-nums">{balance === null ? '₦…' : naira(balance)}</span>
              </div>
            )}
            {hudVisible && (
              <button onClick={openPhone} aria-label="DataPhone (Tab)" title="DataPhone (Tab)" className={`${iconBtn} ${isPhoneOpen ? '!border-bgap-cyan !text-bgap-cyan' : ''}`}>
                <Smartphone className="w-4 h-4" />
              </button>
            )}
            {hudVisible && (
              <button onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'} className={iconBtn}>
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}
            <button onClick={() => setPrefs({ hudVisible: !hudVisible })} aria-label={hudVisible ? 'Hide HUD (H)' : 'Show HUD (H)'} title={hudVisible ? 'Hide HUD (H)' : 'Show HUD (H)'} className={iconBtn}>
              {hudVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button onClick={() => setShowPauseMenu(true)} aria-label="Menu" className={iconBtn}>
              <Menu className="w-4 h-4" />
            </button>
          </div>
          {hudVisible && <MissionTrackerHUD />}
        </div>
      )}

      <Toasts />
      <Speedometer />
      <DistrictBanner />
      <DataPhone />
      <CityMap />
      <TailorShop />
      <CharacterCreator />

      {/* Touch controls (phones/tablets in any orientation) */}
      <MobileTouchControls />
      <RotateDeviceGate />

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
