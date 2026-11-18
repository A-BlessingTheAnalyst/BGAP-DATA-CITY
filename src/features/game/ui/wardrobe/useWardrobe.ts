'use client';
import { useMemo } from 'react';
import { create } from 'zustand';
import { useGameState } from '../../engine/GameState';
import { CHARACTERS, type CharacterDef } from '../../world/kit/characters';
import { resolveLook } from '@/shared/wardrobe/look';
import type { Appearance, Equipped, OutfitItem, PlayerProfile, ProfileView } from '@/shared/types/wardrobe';

// Client mirror of the player's cadet, owned items and the outfit catalog.
// The server decides: saves are validated there, and buying goes through /api/game/shop/buy.

interface WardrobeStore {
  loaded: boolean;
  error: string | null;
  profile: PlayerProfile | null;
  owned: string[];
  items: OutfitItem[];
  byId: Map<string, OutfitItem>;
}

export const useWardrobe = create<WardrobeStore>(() => ({ loaded: false, error: null, profile: null, owned: [], items: [], byId: new Map() }));

const json = async (r: Response) => {
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data?.error ?? r.statusText), { status: r.status, data });
  return data;
};

let loading: Promise<void> | null = null;
export function loadWardrobe(force = false) {
  if (loading && !force) return loading;
  loading = Promise.all([fetch('/api/game/profile').then(json), fetch('/api/game/shop/catalog').then(json)])
    .then(([view, cat]: [ProfileView, { items: OutfitItem[] }]) => {
      useWardrobe.setState({ loaded: true, error: null, profile: view.profile, owned: view.owned, items: cat.items, byId: new Map(cat.items.map((i) => [i.id, i])) });
    })
    .catch((e) => { useWardrobe.setState({ error: String(e.message ?? e) }); loading = null; });
  return loading;
}

/** Creates or updates the cadet on the server; returns the saved profile or throws a readable error. */
export async function saveCadet(patch: { name?: string; appearance?: Appearance; equipped?: Equipped }) {
  const view: ProfileView = await fetch('/api/game/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).then(json);
  useWardrobe.setState({ profile: view.profile, owned: view.owned });
  return view.profile!;
}

/** Buys an item; the wallet balance on the HUD updates from the server's answer. */
export async function buyItem(itemId: string): Promise<{ alreadyOwned: boolean }> {
  const res: { alreadyOwned: boolean; balance: number; owned: string[] } = await fetch('/api/game/shop/buy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId }) }).then(json);
  useWardrobe.setState({ owned: res.owned });
  useGameState.getState().setWalletBalance(res.balance);
  return { alreadyOwned: res.alreadyOwned };
}

const BASE = CHARACTERS.find((c) => c.id === 'player_analyst')!;

/** A drawable character for any appearance + outfit (the creator preview, try-on, the player). */
export function cadetDef(appearance: Appearance, equipped: Equipped, byId: Map<string, OutfitItem>, name = 'Cadet'): CharacterDef {
  const { outfit, look } = resolveLook(appearance, equipped, byId);
  return { ...BASE, id: 'player', name, outfit, look };
}

/** The player's saved look, or the default cadet until the profile has loaded. */
export function usePlayerDef(): CharacterDef {
  const profile = useWardrobe((s) => s.profile);
  const byId = useWardrobe((s) => s.byId);
  return useMemo(() => (profile && byId.size ? cadetDef(profile.appearance, profile.equipped, byId, profile.name) : BASE), [profile, byId]);
}
