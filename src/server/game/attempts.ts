import { randomUUID } from 'node:crypto';
import { jsonFile } from '@/server/storage/jsonFile';
import type { MissionDef, Tier } from '@/shared/types/content';

// Server-side attempt records: the source of truth for hints revealed and time taken.
// One open attempt per (player, mission): reopening the terminal resumes it, so closing and
// reopening can't reset the hint count. A pass closes the attempt.
// Storage: Supabase table `game_attempts` (db/migrations/0002_attempts.sql) when configured,
// otherwise .data/attempts.json for local development.

export interface Attempt {
  id: string;
  userId: string;
  missionId: string;
  startedAt: string;
  /** Hints revealed, in order, with when. Its length is the hint count used for scoring. */
  hintLog: { index: number; at: string }[];
  draft: string | null;
  submissions: number;
  status: 'open' | 'passed';
  lastResult: { isPassed: boolean; totalScore: number; creditsEarned: number; at: string } | null;
}

/** Minutes within which a finish earns the +10% fast bonus. */
const TARGET_MINUTES: Record<Tier, number> = { 1: 15, 2: 25, 3: 40, 4: 60, 5: 90 };
export const targetMinutes = (def: Pick<MissionDef, 'tier'> & { targetMinutes?: number }) => def.targetMinutes ?? TARGET_MINUTES[def.tier];

export function isFast(a: Attempt, def: Pick<MissionDef, 'tier'> & { targetMinutes?: number }, now = Date.now()) {
  return now - Date.parse(a.startedAt) <= targetMinutes(def) * 60_000;
}

interface Store {
  findOpen(userId: string, missionId: string): Promise<Attempt | null>;
  get(userId: string, id: string): Promise<Attempt | null>;
  create(a: Attempt): Promise<Attempt>;
  /** Applies `patch` to the attempt; `patch` may throw to refuse the change. */
  update(userId: string, id: string, patch: (a: Attempt) => Partial<Attempt>): Promise<Attempt>;
}

// ── File store (development) ────────────────────────────────────────────────
const file = jsonFile<Attempt>('attempts.json');
const fileStore: Store = {
  findOpen: async (userId, missionId) => file.read().find((a) => a.userId === userId && a.missionId === missionId && a.status === 'open') ?? null,
  get: async (userId, id) => file.read().find((a) => a.userId === userId && a.id === id) ?? null,
  create: (a) => file.update((rows) => ({ rows: [...rows, a], result: a })),
  update: (userId, id, patch) => file.update((rows) => {
    const i = rows.findIndex((a) => a.userId === userId && a.id === id);
    if (i < 0) throw new Error('Attempt not found.');
    const next = { ...rows[i], ...patch(rows[i]) };
    return { rows: rows.map((a, k) => (k === i ? next : a)), result: next };
  }),
};

// ── Supabase store (production) ─────────────────────────────────────────────
function supabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY && url.startsWith('https://') && !url.includes('your-project') && !url.includes('placeholder');
}
type Row = { id: string; user_id: string; mission_id: string; started_at: string; hint_log: Attempt['hintLog']; draft: string | null; submissions: number; status: Attempt['status']; last_result: Attempt['lastResult'] };
const fromRow = (r: Row): Attempt => ({ id: r.id, userId: r.user_id, missionId: r.mission_id, startedAt: r.started_at, hintLog: r.hint_log ?? [], draft: r.draft, submissions: r.submissions, status: r.status, lastResult: r.last_result });
const toRow = (a: Attempt): Row => ({ id: a.id, user_id: a.userId, mission_id: a.missionId, started_at: a.startedAt, hint_log: a.hintLog, draft: a.draft, submissions: a.submissions, status: a.status, last_result: a.lastResult });

const supabaseStore: Store = {
  async findOpen(userId, missionId) {
    const { supabaseAdmin } = await import('@/server/db/supabase');
    const { data, error } = await supabaseAdmin.from('game_attempts').select('*').eq('user_id', userId).eq('mission_id', missionId).eq('status', 'open').maybeSingle();
    if (error) throw new Error(`Attempt read failed: ${error.message}`);
    return data ? fromRow(data as Row) : null;
  },
  async get(userId, id) {
    const { supabaseAdmin } = await import('@/server/db/supabase');
    const { data, error } = await supabaseAdmin.from('game_attempts').select('*').eq('user_id', userId).eq('id', id).maybeSingle();
    if (error) throw new Error(`Attempt read failed: ${error.message}`);
    return data ? fromRow(data as Row) : null;
  },
  async create(a) {
    const { supabaseAdmin } = await import('@/server/db/supabase');
    const { error } = await supabaseAdmin.from('game_attempts').insert(toRow(a));
    if (error) {
      // Lost a race with another tab: the unique open-attempt index kept one; use it.
      const existing = await supabaseStore.findOpen(a.userId, a.missionId);
      if (existing) return existing;
      throw new Error(`Attempt write failed: ${error.message}`);
    }
    return a;
  },
  async update(userId, id, patch) {
    const current = await supabaseStore.get(userId, id);
    if (!current) throw new Error('Attempt not found.');
    const next = { ...current, ...patch(current) };
    const { supabaseAdmin } = await import('@/server/db/supabase');
    // Optimistic check on the submission/hint counters so concurrent writes can't double-count.
    const { data, error } = await supabaseAdmin.from('game_attempts').update(toRow(next)).eq('id', id).eq('user_id', userId)
      .eq('submissions', current.submissions).select();
    if (error) throw new Error(`Attempt write failed: ${error.message}`);
    if (!data?.length) throw new Error('This attempt changed in another tab. Reopen the terminal.');
    return next;
  },
};

const store = (): Store => (supabaseConfigured() ? supabaseStore : fileStore);

// ── API ─────────────────────────────────────────────────────────────────────

/** Resumes the player's open attempt on this mission, or starts one. */
export async function startAttempt(userId: string, missionId: string): Promise<Attempt> {
  const open = await store().findOpen(userId, missionId);
  if (open) return open;
  return store().create({ id: randomUUID(), userId, missionId, startedAt: new Date().toISOString(), hintLog: [], draft: null, submissions: 0, status: 'open', lastResult: null });
}

export const getAttempt = (userId: string, id: string) => store().get(userId, id);

/** Reveals hint `index`. Hints unlock strictly in order; re-revealing one already open is free. */
export async function revealHint(userId: string, id: string, index: number, hintCount: number): Promise<Attempt> {
  return store().update(userId, id, (a) => {
    if (a.status !== 'open') throw new Error('This case is closed.');
    if (!Number.isInteger(index) || index < 0 || index >= hintCount) throw new Error('No such hint.');
    if (index < a.hintLog.length) return {};
    if (index !== a.hintLog.length) throw new Error('Hints unlock in order.');
    return { hintLog: [...a.hintLog, { index, at: new Date().toISOString() }] };
  });
}

export async function saveDraft(userId: string, id: string, query: string): Promise<Attempt> {
  return store().update(userId, id, (a) => {
    if (a.status !== 'open') throw new Error('This case is closed.');
    return { draft: query.slice(0, 5000) };
  });
}

export async function recordSubmission(userId: string, id: string, r: { isPassed: boolean; totalScore: number; creditsEarned: number }): Promise<Attempt> {
  return store().update(userId, id, (a) => ({
    submissions: a.submissions + 1,
    status: r.isPassed ? 'passed' : a.status,
    lastResult: { isPassed: r.isPassed, totalScore: r.totalScore, creditsEarned: r.creditsEarned, at: new Date().toISOString() },
  }));
}
