'use client';
import type { BarkDef, BarkSituation } from '@/shared/types/barks';

// Loads content/barks.json once (via /api/game/barks) and offers short, floating subtitles above
// whoever is speaking. Deliberately not React state: barks fire from frame loops (traffic,
// pedestrians), so the active list lives in a plain array that BarkLayer polls every frame.

export interface ActiveBark { key: number; x: number; y: number; z: number; text: string; until: number }

export const barkRuntime = { active: [] as ActiveBark[] };

let bySituation: Map<BarkSituation, BarkDef[]> = new Map();
let loaded = false;
let loading: Promise<void> | null = null;

export function loadBarks() {
  if (loaded || loading) return loading ?? Promise.resolve();
  loading = fetch('/api/game/barks')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
    .then((d: { barks: BarkDef[] }) => {
      bySituation = new Map();
      for (const b of d.barks) bySituation.set(b.situation, [...(bySituation.get(b.situation) ?? []), b]);
      loaded = true;
    })
    .catch(() => { loading = null; }); // offline: barks just won't show
  return loading;
}

let nextKey = 0;
const lastBySource = new Map<string, number>();
/** A short, world-positioned subtitle. `source`+`cooldown` stop one speaker from spamming lines. */
export function pushBark(situation: BarkSituation, pos: [number, number, number], source: string, now: number, cooldown = 3, lang: 'en' | 'pcm' = 'pcm') {
  const list = bySituation.get(situation);
  if (!list?.length) return;
  const last = lastBySource.get(source) ?? -Infinity;
  if (now - last < cooldown) return;
  lastBySource.set(source, now);
  const line = list[Math.floor(Math.random() * list.length)];
  barkRuntime.active.push({ key: nextKey++, x: pos[0], y: pos[1], z: pos[2], text: lang === 'en' ? line.text_en : line.text_pcm, until: now + 2.6 });
  if (barkRuntime.active.length > 12) barkRuntime.active.splice(0, barkRuntime.active.length - 12);
}
