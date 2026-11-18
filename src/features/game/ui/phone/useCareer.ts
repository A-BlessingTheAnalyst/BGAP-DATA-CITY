'use client';
import { useEffect } from 'react';
import { create } from 'zustand';
import type { PublicMission } from '@/shared/types/content';
import { useGameState } from '../../engine/GameState';

// Client mirror of career data. The server is authoritative: the wallet and completed missions
// come from /api/game/wallet (the ledger), the job board from /api/game/missions.

export interface LedgerEntryView { id: string; amount: number; kind: 'earning' | 'purchase' | 'grant'; reason: string; missionId: string | null; createdAt: string }

interface CareerStore {
  missions: PublicMission[] | null;
  missionsError: string | null;
  entries: LedgerEntryView[];
  xp: number;
  setMissions: (m: PublicMission[]) => void;
  setMissionsError: (e: string) => void;
  setLedger: (entries: LedgerEntryView[], xp: number) => void;
}

export const useCareerStore = create<CareerStore>((set) => ({
  missions: null,
  missionsError: null,
  entries: [],
  xp: 0,
  setMissions: (missions) => set({ missions, missionsError: null }),
  setMissionsError: (missionsError) => set({ missionsError }),
  setLedger: (entries, xp) => set({ entries, xp }),
}));

let missionsRequest: Promise<void> | null = null;

export function loadMissions(force = false) {
  if (missionsRequest && !force) return missionsRequest;
  missionsRequest = fetch('/api/game/missions')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
    .then((d: { missions: PublicMission[] }) => useCareerStore.getState().setMissions(d.missions))
    .catch((e) => { useCareerStore.getState().setMissionsError(String(e.message ?? e)); missionsRequest = null; });
  return missionsRequest;
}

export async function refreshWallet() {
  try {
    const r = await fetch('/api/game/wallet');
    if (!r.ok) return;
    const w: { balance: number; xp: number; entries: LedgerEntryView[]; completedMissions: string[] } = await r.json();
    const gs = useGameState.getState();
    gs.setWalletBalance(w.balance);
    w.completedMissions.forEach((id) => gs.markMissionCompleted(id));
    if (w.completedMissions.includes('ch1_cafe_revenue_mystery') && gs.missionState !== 'completed') gs.setMissionState('completed');
    useCareerStore.getState().setLedger(w.entries, w.xp);
  } catch {
    // Offline: keep the last known values.
  }
}

/** Loads the job board and wallet once when the game starts. */
export function useCareerBootstrap() {
  useEffect(() => {
    loadMissions();
    refreshWallet();
  }, []);
}

export const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;
