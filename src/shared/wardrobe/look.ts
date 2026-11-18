// Turns a player's appearance + equipped items into the character the renderer draws, and
// validates looks on the server. Pure TS (types only from the 3D kit), so scripts can import it.
import { PALETTE } from '@/features/game/world/kit/palette';
import type { Outfit, Garment, Headwear } from '@/features/game/world/kit/characters';
import type { CharacterLook } from '@/features/game/world/kit/CharacterModel';
import { HAIR_COLORS, HAIR_STYLES, SKIN_COUNT, type Appearance, type Equipped, type OutfitItem, type Slot } from '@/shared/types/wardrobe';

export const DEFAULT_APPEARANCE: Appearance = { body: 'female', skin: 3, skinTone: 1.05, hair: 'Hair_Buns', hairColor: '#1E1714' };
export const DEFAULT_EQUIPPED: Equipped = { top: 'starter_polo_teal', bottom: 'starter_trousers_navy', shoes: 'starter_sneakers_black' };

/** Six ready-made cadets for the quick pick. */
export const PRESET_CADETS: { label: string; appearance: Appearance; equipped: Equipped }[] = [
  { label: 'Ada', appearance: { body: 'female', skin: 3, skinTone: 1.05, hair: 'Hair_Buns', hairColor: '#1E1714' }, equipped: DEFAULT_EQUIPPED },
  { label: 'Tobi', appearance: { body: 'male', skin: 1, skinTone: 0.95, hair: 'Hair_Buzzed', hairColor: '#1E1714' }, equipped: { top: 'starter_polo_white', bottom: 'starter_chinos_khaki', shoes: 'starter_sneakers_white' } },
  { label: 'Zara', appearance: { body: 'female', skin: 5, skinTone: 1, hair: 'Hair_Long', hairColor: '#2A201C' }, equipped: { top: 'starter_polo_maroon', bottom: 'starter_jeans_black', shoes: 'starter_sneakers_white' } },
  { label: 'Emeka', appearance: { body: 'male', skin: 2, skinTone: 1, hair: 'Hair_Beard', hairColor: '#1E1714' }, equipped: { top: 'starter_polo_indigo', bottom: 'starter_trousers_navy', shoes: 'starter_sneakers_black' } },
  { label: 'Funmi', appearance: { body: 'female', skin: 0, skinTone: 1.1, hair: 'Hair_BuzzedFemale', hairColor: '#1E1714' }, equipped: { top: 'starter_polo_mustard', bottom: 'starter_jeans_black', shoes: 'starter_sneakers_black' } },
  { label: 'Musa', appearance: { body: 'male', skin: 4, skinTone: 1, hair: 'Hair_SimpleParted', hairColor: '#2A201C' }, equipped: { top: 'starter_polo_teal', bottom: 'starter_chinos_khaki', shoes: 'starter_sneakers_white' } },
];

const SLOTS: Slot[] = ['top', 'bottom', 'dress', 'shoes', 'head'];
const GARMENTS: Record<string, Garment> = { shirt: 'shirt', suit: 'suit', kaftan: 'kaftan', boubou: 'boubou' };
const HEADWEAR: Record<string, Headwear> = { cap: 'cap', kufi: 'kufi', gele: 'gele', beret: 'beret' };

/** Validates and normalises an appearance; throws a player-readable message on bad input. */
export function cleanAppearance(a: unknown): Appearance {
  const v = (a ?? {}) as Record<string, unknown>;
  const body = v.body === 'male' ? 'male' : v.body === 'female' ? 'female' : null;
  if (!body) throw new Error('Pick a body type.');
  const skin = Number(v.skin);
  if (!Number.isInteger(skin) || skin < 0 || skin >= SKIN_COUNT) throw new Error('Pick a skin tone.');
  const skinTone = Math.min(1.2, Math.max(0.8, Number(v.skinTone ?? 1) || 1));
  const hair = HAIR_STYLES[body].includes(v.hair as never) ? (v.hair as Appearance['hair']) : null;
  if (!hair) throw new Error('That hairstyle is not available for this body.');
  const hairColor = HAIR_COLORS.includes(String(v.hairColor)) ? String(v.hairColor) : HAIR_COLORS[0];
  return { body, skin, skinTone, hair, hairColor };
}

/** Validates equipped items against the catalog and what the player owns. */
export function cleanEquipped(e: unknown, items: Map<string, OutfitItem>, owned: Set<string>): Equipped {
  const v = (e ?? {}) as Record<string, unknown>;
  const out: Partial<Equipped> = {};
  for (const slot of SLOTS) {
    const id = v[slot];
    if (id === undefined || id === null || id === '') continue;
    const item = items.get(String(id));
    if (!item) throw new Error(`Unknown item "${String(id)}".`);
    if (item.slot !== slot) throw new Error(`${item.name} doesn't go in the ${slot} slot.`);
    if (!owned.has(item.id)) throw new Error(`You don't own ${item.name} yet.`);
    out[slot] = item.id;
  }
  if (!out.shoes) throw new Error('Pick some shoes.');
  if (out.dress) { delete out.top; delete out.bottom; }
  else if (!out.top || !out.bottom) throw new Error('Pick a top and a bottom (or a full-length outfit).');
  return out as Equipped;
}

/** The character to draw for this look (rigged model + procedural fallback). */
export function resolveLook(appearance: Appearance, equipped: Equipped, items: Map<string, OutfitItem>): { outfit: Outfit; look: CharacterLook } {
  const get = (id?: string) => (id ? items.get(id) : undefined);
  const dress = get(equipped.dress), top = get(equipped.top), bottom = get(equipped.bottom), shoes = get(equipped.shoes), head = get(equipped.head);
  const skin = PALETTE.skin[appearance.skin] ?? PALETTE.skin[3];
  const garment: Garment = dress ? GARMENTS[dress.style] ?? 'kaftan' : GARMENTS[top?.style ?? 'shirt'] ?? 'shirt';
  const outfit: Outfit = {
    skin,
    top: dress?.color ?? top?.color ?? '#13837A',
    bottom: dress?.color ?? bottom?.color ?? '#1D2B45',
    garment,
    head: head ? HEADWEAR[head.style] ?? 'short' : appearance.hair === 'none' ? 'bald' : 'short',
    headColor: head?.color,
    shoes: shoes?.color ?? '#1B1C20',
    accent: dress?.accent ?? top?.accent,
    accessories: top?.style === 'suit' ? ['tie'] : [],
  };
  // A tall gele or a kufi replaces the hair mesh.
  const hatHidesHair = head && (head.style === 'gele' || head.style === 'kufi');
  const look: CharacterLook = {
    body: appearance.body,
    hair: hatHidesHair ? 'none' : appearance.hair,
    skin,
    skinTone: appearance.skinTone,
    hairColor: appearance.hairColor,
  };
  return { outfit, look };
}

/**
 * Puts an item on. A dress replaces top and bottom; a top or bottom takes the dress off (the other
 * half comes from `fallback`). Picking the headwear you already wear takes it off.
 */
export function wearItem(equipped: Equipped, item: OutfitItem, fallback: { top: string; bottom: string }): Equipped {
  const next: Equipped = { ...equipped };
  if (item.slot === 'dress') { next.dress = item.id; delete next.top; delete next.bottom; }
  else if (item.slot === 'top' || item.slot === 'bottom') {
    next[item.slot] = item.id;
    if (next.dress) { delete next.dress; next.top ??= fallback.top; next.bottom ??= fallback.bottom; }
  } else if (item.slot === 'head') {
    if (next.head === item.id) delete next.head; else next.head = item.id;
  } else next.shoes = item.id;
  return next;
}
