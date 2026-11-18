// Phase B: the player's look, the outfit catalog and what they own.
// Shared by the server (validation, shop, profile) and the client (creator, wardrobe, renderer).

export type Slot = 'top' | 'bottom' | 'dress' | 'shoes' | 'head';
export type OutfitTag = 'starter' | 'casual' | 'corporate' | 'traditional';
export type BodyType = 'female' | 'male';
export type HairStyle = 'Hair_Buns' | 'Hair_Buzzed' | 'Hair_BuzzedFemale' | 'Hair_Long' | 'Hair_SimpleParted' | 'Hair_Beard' | 'none';

/** One item in content/outfits.json. */
export interface OutfitItem {
  id: string;
  name: string;
  slot: Slot;
  /** How the item is drawn. Tops: shirt | suit | kaftan. Dresses: boubou | kaftan. Head: cap | kufi | gele | beret. */
  style: string;
  color: string;
  /** Second colour (tie, trim, pattern accent). */
  accent?: string;
  price: number;
  tags: OutfitTag[];
  description: string;
}

export interface Appearance {
  body: BodyType;
  /** Index into PALETTE.skin (0 = deepest). */
  skin: number;
  /** Fine adjustment, 0.8–1.2. */
  skinTone: number;
  hair: HairStyle;
  hairColor: string;
}

/** Equipped item ids. A dress replaces top and bottom. */
export interface Equipped {
  top?: string;
  bottom?: string;
  dress?: string;
  shoes: string;
  head?: string;
}

export interface PlayerProfile {
  userId: string;
  name: string;
  appearance: Appearance;
  equipped: Equipped;
  createdAt: string;
  updatedAt: string;
}

/** What /api/game/profile returns: the profile (null before the creator) and owned item ids. */
export interface ProfileView {
  profile: PlayerProfile | null;
  owned: string[];
}

export const HAIR_STYLES: Record<BodyType, HairStyle[]> = {
  female: ['Hair_Buns', 'Hair_Long', 'Hair_BuzzedFemale', 'none'],
  male: ['Hair_Buzzed', 'Hair_SimpleParted', 'Hair_Beard', 'none'],
};
export const HAIR_COLORS = ['#1E1714', '#2A201C', '#4A3326', '#6B4A32', '#8C6A4A', '#B9B3AA'];
export const SKIN_COUNT = 7;
