import fs from 'node:fs';
import path from 'node:path';
import type { OutfitItem, OutfitTag, Slot } from '@/shared/types/wardrobe';

// The outfit catalog (content/outfits.json). Re-read in development so edits show up live.

const FILE = path.join(process.cwd(), 'content', 'outfits.json');
const SLOTS: Slot[] = ['top', 'bottom', 'dress', 'shoes', 'head'];
const TAGS: OutfitTag[] = ['starter', 'casual', 'corporate', 'traditional'];
const STYLES: Record<Slot, string[]> = {
  top: ['shirt', 'suit', 'kaftan'],
  bottom: ['trousers', 'skirt'],
  dress: ['kaftan', 'boubou'],
  shoes: ['sneakers', 'sandals', 'oxfords'],
  head: ['cap', 'kufi', 'gele', 'beret'],
};

let cache: { items: OutfitItem[]; byId: Map<string, OutfitItem> } | null = null;

/** Problems with the catalog (empty when valid). Used by the loader and validate-missions. */
export function checkCatalog(items: OutfitItem[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const it of items) {
    const at = `outfit "${it.id}"`;
    if (!/^[a-z0-9_]{3,48}$/.test(it.id ?? '')) errors.push(`${at}: id must be snake_case`);
    if (ids.has(it.id)) errors.push(`${at}: duplicate id`);
    ids.add(it.id);
    if (!SLOTS.includes(it.slot)) errors.push(`${at}: unknown slot ${it.slot}`);
    else if (!STYLES[it.slot].includes(it.style)) errors.push(`${at}: style "${it.style}" is not valid for ${it.slot}`);
    if (!/^#[0-9A-Fa-f]{6}$/.test(it.color ?? '')) errors.push(`${at}: color must be #RRGGBB`);
    if (it.accent && !/^#[0-9A-Fa-f]{6}$/.test(it.accent)) errors.push(`${at}: accent must be #RRGGBB`);
    if (!Number.isInteger(it.price) || it.price < 0) errors.push(`${at}: price must be a whole number of naira`);
    if (!it.tags?.length || it.tags.some((t) => !TAGS.includes(t))) errors.push(`${at}: tags must be from ${TAGS.join(', ')}`);
    if (it.tags?.includes('starter') !== (it.price === 0)) errors.push(`${at}: starter items are free and only starter items are free`);
    if (!it.name || !it.description) errors.push(`${at}: needs a name and description`);
  }
  for (const slot of ['top', 'bottom', 'shoes'] as Slot[]) {
    if (!items.some((i) => i.slot === slot && i.tags.includes('starter'))) errors.push(`catalog: needs at least one starter ${slot}`);
  }
  return errors;
}

export function catalog() {
  if (cache && process.env.NODE_ENV === 'production') return cache;
  const items = (JSON.parse(fs.readFileSync(FILE, 'utf8')) as { items: OutfitItem[] }).items;
  const errors = checkCatalog(items);
  if (errors.length) throw new Error(`content/outfits.json is invalid:\n${errors.join('\n')}`);
  cache = { items, byId: new Map(items.map((i) => [i.id, i])) };
  return cache;
}

export const starterIds = () => catalog().items.filter((i) => i.tags.includes('starter')).map((i) => i.id);
