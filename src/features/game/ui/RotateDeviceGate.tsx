'use client';
import { useEffect, useState } from 'react';
import { Maximize2, RotateCw, Smartphone } from 'lucide-react';
import { useGameState } from '../engine/GameState';
import { useIsPortrait, useIsTouch } from './hudPrefs';

// Phones play in landscape. When the city is on screen on a touch device held upright, this covers
// the game with a rotate prompt. Where the browser allows it (Android Chrome and most installed
// PWAs), one tap goes fullscreen and locks landscape; iOS Safari can't lock orientation from a web
// page, so it shows the turn-your-phone instruction and unblocks itself as soon as you rotate.
// The character creator and full-screen menus still work upright, so they're not gated.

type LockableOrientation = ScreenOrientation & { lock?: (o: 'landscape') => Promise<void> };

export async function enterLandscape(): Promise<boolean> {
  try {
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };
    if (!document.fullscreenElement) await (el.requestFullscreen?.({ navigationUI: 'hide' }) ?? el.webkitRequestFullscreen?.());
    const o = screen.orientation as LockableOrientation | undefined;
    await o?.lock?.('landscape');
    return true;
  } catch {
    return false; // unsupported (iOS) or denied: the player rotates by hand
  }
}

const SKIP_KEY = 'datacity.portraitOk';

export function RotateDeviceGate() {
  const touch = useIsTouch();
  const portrait = useIsPortrait();
  const menuUp = useGameState((s) => s.isCreatorOpen);
  const [skipped, setSkipped] = useState(false);
  const [tried, setTried] = useState(false);
  useEffect(() => { try { setSkipped(window.sessionStorage.getItem(SKIP_KEY) === '1'); } catch { /* storage blocked */ } }, []);

  // While gated, the world shouldn't run on under the overlay.
  const gated = touch && portrait && !menuUp && !skipped;
  useEffect(() => {
    if (!gated) return;
    const s = useGameState.getState();
    if (s.isPaused) return; // someone else paused: leave it to them
    s.togglePause();
    // Only undo our own pause.
    return () => { if (useGameState.getState().isPaused) useGameState.getState().togglePause(); };
  }, [gated]);

  if (!gated) return null;
  return (
    <div className="fixed inset-0 z-[60] pointer-events-auto bg-[#0B1220]/95 backdrop-blur-md flex flex-col items-center justify-center text-center px-8 gap-5 text-white">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <Smartphone className="w-14 h-14 text-bgap-cyan origin-center" style={{ animation: 'dc-rotate 2.4s ease-in-out infinite alternate' }} />
        <RotateCw className="absolute -right-1 -top-1 w-6 h-6 text-bgap-gold" />
      </div>
      <style>{'@keyframes dc-rotate { 0%,25% { transform: rotate(0deg) } 60%,100% { transform: rotate(-90deg) } }'}</style>
      <div>
        <h2 className="text-xl font-extrabold">Turn your phone sideways</h2>
        <p className="text-sm text-white/75 mt-1.5 max-w-xs mx-auto">Data City plays in landscape: room for the city, the map and both thumbs.</p>
      </div>
      <button
        onClick={async () => { setTried(true); await enterLandscape(); }}
        className="px-5 py-3 rounded-xl bg-bgap-cyan text-bgap-dark font-extrabold text-sm inline-flex items-center gap-2"
      >
        <Maximize2 className="w-4 h-4" /> Play fullscreen in landscape
      </button>
      {tried && <p className="text-xs text-white/60 max-w-xs">If nothing turned, switch off rotation lock and turn your phone. On iPhone, add Data City to your Home Screen for true fullscreen.</p>}
      <button
        onClick={() => { setSkipped(true); try { window.sessionStorage.setItem(SKIP_KEY, '1'); } catch { /* storage blocked */ } }}
        className="text-xs text-white/50 underline underline-offset-2"
      >
        Continue in portrait anyway
      </button>
    </div>
  );
}
