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
