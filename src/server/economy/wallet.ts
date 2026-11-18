import { randomUUID } from 'node:crypto';
import { jsonFile } from '@/server/storage/jsonFile';

// The wallet ledger: one row per earning or purchase; balance = sum of amounts.
// Writes are idempotent per (user, key), so retries and resubmissions never pay twice.
// Storage: Supabase table `wallet_ledger` (db/migrations/0001_wallet_ledger.sql) when the
// service-role env vars are set; otherwise a JSON file in .data/ for local development.

export interface LedgerEntry {
  id: string;
  userId: string;
  amount: number;
  kind: 'earning' | 'purchase' | 'grant';
  reason: string;
  missionId: string | null;
  xp: number;
  idempotencyKey: string;
  createdAt: string;
}

export interface Wallet {
  balance: number;
  xp: number;
  entries: LedgerEntry[];
  completedMissions: string[];
}

export const WELCOME_GRANT = 5000;

interface Store {
  list(userId: string): Promise<LedgerEntry[]>;
  /** Inserts unless (userId, idempotencyKey) exists; returns the stored row and whether it was new. */
  insert(e: Omit<LedgerEntry, 'id' | 'createdAt'>): Promise<{ entry: LedgerEntry; created: boolean }>;
  /**
   * Inserts a negative (spending) row only if the balance covers it, in one atomic step, and only
   * once per idempotency key. Throws InsufficientFunds when the player can't afford it.
   */
  debit(e: Omit<LedgerEntry, 'id' | 'createdAt'>): Promise<{ entry: LedgerEntry; created: boolean }>;
}

export class InsufficientFunds extends Error {
  constructor(public balance: number, public price: number) {
    super(`Not enough money: you have ₦${balance.toLocaleString('en-NG')}, this costs ₦${price.toLocaleString('en-NG')}.`);
  }
}

// ── File store (development) ────────────────────────────────────────────────
const file = jsonFile<LedgerEntry>('wallet-ledger.json');

const fileStore: Store = {
  list: async (userId) => file.read().filter((e) => e.userId === userId),
  insert: (e) => file.update<{ entry: LedgerEntry; created: boolean }>((all) => {
    const existing = all.find((x) => x.userId === e.userId && x.idempotencyKey === e.idempotencyKey);
    if (existing) return { rows: all, result: { entry: existing, created: false } };
    const entry: LedgerEntry = { ...e, id: randomUUID(), createdAt: new Date().toISOString() };
    return { rows: [...all, entry], result: { entry, created: true } };
  }),
  debit: (e) => file.update<{ entry: LedgerEntry; created: boolean }>((all) => {
    const existing = all.find((x) => x.userId === e.userId && x.idempotencyKey === e.idempotencyKey);
    if (existing) return { rows: all, result: { entry: existing, created: false } };
    const balance = all.filter((x) => x.userId === e.userId).reduce((sum, x) => sum + x.amount, 0);
    if (balance + e.amount < 0) throw new InsufficientFunds(balance, -e.amount);
    const entry: LedgerEntry = { ...e, id: randomUUID(), createdAt: new Date().toISOString() };
    return { rows: [...all, entry], result: { entry, created: true } };
  }),
};

// ── Supabase store (production) ─────────────────────────────────────────────
function supabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY && url.startsWith('https://') && !url.includes('your-project') && !url.includes('placeholder');
}

type DbRow = { id: string; user_id: string; amount: number; kind: LedgerEntry['kind']; reason: string; mission_id: string | null; xp: number; idempotency_key: string; created_at: string };
const fromDb = (r: DbRow): LedgerEntry => ({ id: r.id, userId: r.user_id, amount: Number(r.amount), kind: r.kind, reason: r.reason, missionId: r.mission_id, xp: r.xp, idempotencyKey: r.idempotency_key, createdAt: r.created_at });

const supabaseStore: Store = {
  async list(userId) {
    const { supabaseAdmin } = await import('@/server/db/supabase');
    const { data, error } = await supabaseAdmin.from('wallet_ledger').select('*').eq('user_id', userId).order('created_at', { ascending: true });
    if (error) throw new Error(`Wallet read failed: ${error.message}`);
    return (data as DbRow[]).map(fromDb);
  },
  async insert(e) {
    const { supabaseAdmin } = await import('@/server/db/supabase');
    const row = { user_id: e.userId, amount: e.amount, kind: e.kind, reason: e.reason, mission_id: e.missionId, xp: e.xp, idempotency_key: e.idempotencyKey };
    const { data, error } = await supabaseAdmin.from('wallet_ledger').upsert(row, { onConflict: 'user_id,idempotency_key', ignoreDuplicates: true }).select();
    if (error) throw new Error(`Wallet write failed: ${error.message}`);
    if (data && data.length) return { entry: fromDb(data[0] as DbRow), created: true };
    const { data: existing } = await supabaseAdmin.from('wallet_ledger').select('*').eq('user_id', e.userId).eq('idempotency_key', e.idempotencyKey).single();
    return { entry: fromDb(existing as DbRow), created: false };
  },
  async debit(e) {
    // wallet_debit (db/migrations/0003_shop.sql) locks the player's ledger, checks the balance
    // and inserts in one transaction; it returns the row and whether it was new.
    const { supabaseAdmin } = await import('@/server/db/supabase');
    const { data, error } = await supabaseAdmin.rpc('wallet_debit', {
      p_user_id: e.userId, p_amount: e.amount, p_kind: e.kind, p_reason: e.reason, p_idempotency_key: e.idempotencyKey,
    });
    if (error) {
      const m = /insufficient funds: balance (-?d+)/i.exec(error.message);
      if (m) throw new InsufficientFunds(Number(m[1]), -e.amount);
      throw new Error(`Wallet write failed: ${error.message}`);
    }
    const r = (Array.isArray(data) ? data[0] : data) as DbRow & { created: boolean };
    return { entry: fromDb(r), created: !!r.created };
  },
};

const store = (): Store => (supabaseConfigured() ? supabaseStore : fileStore);

// ── API ─────────────────────────────────────────────────────────────────────
export async function getWallet(userId: string): Promise<Wallet> {
  // Every new player starts with a small stipend from the Academy.
  await store().insert({ userId, amount: WELCOME_GRANT, kind: 'grant', reason: 'Welcome stipend from BGAP Academy', missionId: null, xp: 0, idempotencyKey: 'grant:welcome' });
  const entries = await store().list(userId);
  return {
    balance: entries.reduce((s, e) => s + e.amount, 0),
    xp: entries.reduce((s, e) => s + e.xp, 0),
    entries: [...entries].reverse().slice(0, 50),
    completedMissions: [...new Set(entries.filter((e) => e.kind === 'earning' && e.missionId).map((e) => e.missionId as string))],
  };
}

/** Pays for a completed mission. Only the grader route may call this. */
export async function creditMissionReward(p: { userId: string; missionId: string; amount: number; xp: number; reason: string }) {
  if (!Number.isFinite(p.amount) || p.amount <= 0) throw new Error('Reward must be a positive amount.');
  return store().insert({ userId: p.userId, amount: Math.round(p.amount), kind: 'earning', reason: p.reason, missionId: p.missionId, xp: Math.round(p.xp), idempotencyKey: `reward:${p.missionId}` });
}

/**
 * Buys a catalog item once: a negative ledger row keyed `buy:<itemId>`, written only if the
 * balance covers it. Buying something you already own is free and returns created = false.
 */
export async function purchaseItem(p: { userId: string; itemId: string; price: number; name: string }) {
  if (!Number.isInteger(p.price) || p.price < 0) throw new Error('Bad price.');
  await getWallet(p.userId); // make sure the welcome grant exists first
  return store().debit({ userId: p.userId, amount: -p.price, kind: 'purchase', reason: `Bought ${p.name}`, missionId: null, xp: 0, idempotencyKey: `buy:${p.itemId}` });
}

/** Item ids the player has bought (starter items are owned by everyone and not listed here). */
export async function purchasedItems(userId: string): Promise<string[]> {
  return (await store().list(userId)).filter((e) => e.kind === 'purchase' && e.idempotencyKey.startsWith('buy:')).map((e) => e.idempotencyKey.slice(4));
}
