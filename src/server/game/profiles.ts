import { jsonFile } from '@/server/storage/jsonFile';
import { catalog, starterIds } from '@/server/content/outfits';
import { purchasedItems } from '@/server/economy/wallet';
import { cleanAppearance, cleanEquipped } from '@/shared/wardrobe/look';
import type { PlayerProfile, ProfileView } from '@/shared/types/wardrobe';

// The player's cadet: name, body, skin, hair and equipped outfit. Ownership comes from the wallet
// ledger (purchases), so equipping something you haven't bought is refused here.
// Storage: .data/profiles.json in development; Supabase `player_profiles` (db/migrations/0003_shop.sql).

const file = jsonFile<PlayerProfile>('profiles.json');

function supabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY && url.startsWith('https://') && !url.includes('your-project') && !url.includes('placeholder');
}

type Row = { user_id: string; name: string; appearance: PlayerProfile['appearance']; equipped: PlayerProfile['equipped']; created_at: string; updated_at: string };
const fromRow = (r: Row): PlayerProfile => ({ userId: r.user_id, name: r.name, appearance: r.appearance, equipped: r.equipped, createdAt: r.created_at, updatedAt: r.updated_at });

async function load(userId: string): Promise<PlayerProfile | null> {
  if (!supabaseConfigured()) return file.read().find((p) => p.userId === userId) ?? null;
  const { supabaseAdmin } = await import('@/server/db/supabase');
  const { data, error } = await supabaseAdmin.from('player_profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw new Error(`Profile read failed: ${error.message}`);
  return data ? fromRow(data as Row) : null;
}

async function store(p: PlayerProfile): Promise<PlayerProfile> {
  if (!supabaseConfigured()) {
    return file.update((rows) => ({ rows: [...rows.filter((r) => r.userId !== p.userId), p], result: p }));
  }
  const { supabaseAdmin } = await import('@/server/db/supabase');
  const { error } = await supabaseAdmin.from('player_profiles').upsert({ user_id: p.userId, name: p.name, appearance: p.appearance, equipped: p.equipped, created_at: p.createdAt, updated_at: p.updatedAt });
  if (error) throw new Error(`Profile write failed: ${error.message}`);
  return p;
}

export async function ownedItems(userId: string): Promise<string[]> {
  return [...new Set([...starterIds(), ...(await purchasedItems(userId))])];
}

export async function getProfileView(userId: string): Promise<ProfileView> {
  return { profile: await load(userId), owned: await ownedItems(userId) };
}

export function cleanName(v: unknown): string {
  const name = String(v ?? '').replace(/\s+/g, ' ').trim();
  if (name.length < 2 || name.length > 24) throw new Error('Your cadet name needs 2–24 characters.');
  if (!/^[\p{L}\p{M}' .-]+$/u.test(name)) throw new Error('Use letters, spaces, apostrophes or hyphens in your name.');
  return name;
}

/** Creates or updates the cadet. Any field left out keeps its saved value. */
export async function saveProfile(userId: string, body: { name?: unknown; appearance?: unknown; equipped?: unknown }): Promise<PlayerProfile> {
  const current = await load(userId);
  if (!current && (body.name === undefined || body.appearance === undefined || body.equipped === undefined)) {
    throw new Error('Create your cadet first: name, appearance and outfit are all needed.');
  }
  const { byId } = catalog();
  const owned = new Set(await ownedItems(userId));
  const now = new Date().toISOString();
  return store({
    userId,
    name: body.name !== undefined ? cleanName(body.name) : current!.name,
    appearance: body.appearance !== undefined ? cleanAppearance(body.appearance) : current!.appearance,
    equipped: body.equipped !== undefined ? cleanEquipped(body.equipped, byId, owned) : current!.equipped,
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
  });
}
