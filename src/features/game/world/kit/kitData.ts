// Pure kit metadata (no React, no three): sizes of optimised library models in metres.
// Shared by the renderer (KitModel), the city plan, the minimap and the layout validator.
import kitIndex from './generated/kitIndex.json';

export type V3 = [number, number, number];

type Index = { packs: Record<string, { name: string; author: string; licence: string; url: string; models: Record<string, { url: string; size: number[]; min: number[]; max: number[]; skinned: boolean; animations: string[]; node?: string }> }> };
export const KIT_INDEX = kitIndex as unknown as Index;

/** Kit units → metres. Kenney city tiles are 1 unit; a 10 m tile gives two lanes and kerbs. */
export const PACK_SCALE: Record<string, number> = {
  'kenney-roads': 10,
  'kenney-commercial': 8,
  'kenney-suburban': 8,
  'kenney-cars': 1.6,
  'kenney-nature': 5,
  // Quaternius packs are authored in metres.
};

export type KitRef = `${string}/${string}`; // "pack/model"

export function kitInfo(ref: KitRef) {
  const [pack, name] = ref.split('/');
  const m = KIT_INDEX.packs[pack]?.models[name];
  if (!m) throw new Error(`Kit model not found: ${ref}. Run node scripts/assets/optimize.mjs`);
  return { ...m, pack, name, scale: PACK_SCALE[pack] ?? 1, credit: KIT_INDEX.packs[pack] };
}

/** Real-world footprint and height of a kit model, in metres. */
export function kitSize(ref: KitRef, scale?: number): V3 {
  const i = kitInfo(ref);
  const s = scale ?? i.scale;
  return [i.size[0] * s, i.size[1] * s, i.size[2] * s];
}

// ── Modular (Quaternius MegaKit) buildings ──
export const BAY = 2;
export const FLOOR = 3;

export interface ModularSpec {
  /** Bays along the front (2 m each). Even numbers keep the roof tiling clean. */
  bays: number;
  /** Bays along the sides (2 m each). */
  depth: number;
  floors: number;
  /** Wall piece for upper floors on the front and back. */
  window?: string;
  /** Wall piece for upper floors on the sides. */
  sideWindow?: string;
  /** Ground-floor shopfront piece. */
  shopfront?: string;
  cornice?: 'Cornice_Brick_Center' | 'Cornice_Metal_Center' | 'Cornice_Trim_Center';
  sign?: { text: string; sub?: string; bg: string; fg?: string };
}

export function modularSize(s: ModularSpec): V3 {
  return [s.bays * BAY, s.floors * FLOOR + 1, s.depth * BAY];
}
