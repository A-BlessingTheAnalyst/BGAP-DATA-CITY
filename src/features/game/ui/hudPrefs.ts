'use client';
import { useEffect, useState } from 'react';
import { create } from 'zustand';

// What the HUD shows. The default is deliberately minimal (map + a small status chip); everything
// else is on demand. Remembered in this browser (per-viewer convenience only).

interface HudPrefs {
  /** H (or the eye button) hides everything except the minimap. */
  hudVisible: boolean;
  showTracker: boolean;
  /** One-time guidance toasts (controls, first drive, …). */
  showTips: boolean;
  trackerExpanded: boolean;
  set: (patch: Partial<Omit<HudPrefs, 'set'>>) => void;
}

const KEY = 'datacity.hud';
function load(): Partial<HudPrefs> {
  try {
    const v = typeof window === 'undefined' ? null : JSON.parse(window.localStorage.getItem(KEY) ?? '{}');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

export const useHudPrefs = create<HudPrefs>((set, get) => ({
  hudVisible: true,
  showTracker: true,
  showTips: true,
  trackerExpanded: false,
  ...load(),
  set: (patch) => {
    set(patch);
    const { hudVisible, showTracker, showTips, trackerExpanded } = { ...get(), ...patch };
    try { window.localStorage.setItem(KEY, JSON.stringify({ hudVisible, showTracker, showTips, trackerExpanded })); } catch { /* storage blocked */ }
  },
}));

function useMedia(query: string, fallback = false) {
  const [match, setMatch] = useState(fallback);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatch(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return match;
}

/** A touch-first device (phone/tablet). Width-based breakpoints get this wrong: a phone held in
 * landscape is wider than `md`, which used to hide the touch controls exactly when you play. */
export const useIsTouch = () => useMedia('(pointer: coarse) and (hover: none)');
export const useIsPortrait = () => useMedia('(orientation: portrait)');
/** Landscape phones: very little height to spare, so the HUD shrinks. */
export const useIsShort = () => useMedia('(max-height: 500px)');
