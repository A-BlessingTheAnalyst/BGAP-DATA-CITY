import type { MissionDef, Row } from '@/shared/types/content';
import { creditMissionReward } from '@/server/economy/wallet';

// Spreadsheet (and optionally Python/SQL) missions are worked in BGAP's own workspace
// (workspace.bgap.app) instead of re-building an Excel engine inside the game. Flow:
//   1. launch: record a workspace_launches row and build the workspace URL with the mission's
//      brief, deliverables, checks and dataset (the same query-param contract bgap.app's
//      Challenge Lab uses). The browser appends its Supabase tokens in the #hash, exactly like
//      bgap.app does, so the workspace signs the same player in.
//   2. The workspace grades it and writes public.challenge_completions (title = launch title).
//   3. verify: Data City reads that completion server-side (never trusting the browser), pays the
//      mission once through the idempotent wallet ledger and marks the launch verified.

export const workspaceTitle = (def: MissionDef) => `Data City · ${def.title}`.slice(0, 200);
const WORKSPACE_URL = () => process.env.NEXT_PUBLIC_WORKSPACE_URL || 'https://workspace.bgap.app';
const LEVEL = (tier: number) => (tier <= 1 ? 'Beginner' : tier <= 3 ? 'Intermediate' : 'Advanced');

function datasetFor(data: Record<string, Row[]>) {
  const names = Object.keys(data);
  if (names.length === 1) return data[names[0]];
  // Workspace multi-table format: { tables: [{ name, headers, rows: [[…]] }] }
  return {
    tables: names.map((name) => {
      const rows = data[name];
      const headers = rows.length ? Object.keys(rows[0]) : [];
      return { name, headers, rows: rows.map((r) => headers.map((h) => r[h])) };
    }),
  };
}

function supabaseReady() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY && url.startsWith('https://') && !url.includes('placeholder');
}

export async function launchWorkspace(userId: string, def: MissionDef, data: Record<string, Row[]>, returnTo: string) {
  if (!def.workspace) throw new Error('This case is solved in the SQL terminal, not the workspace.');
  const title = workspaceTitle(def);
  const tool = def.workspace.tool ?? 'excel';
  if (supabaseReady()) {
    const { supabaseAdmin } = await import('@/server/db/supabase');
    const { error } = await supabaseAdmin.from('workspace_launches').upsert(
      { user_id: userId, mission_id: def.id, challenge_title: title, tool, launched_at: new Date().toISOString() },
      { onConflict: 'user_id,mission_id', ignoreDuplicates: false },
    );
    if (error) console.warn('[workspace] launch not recorded:', error.message);
  }
  const q = new URLSearchParams({
    id: `datacity:${def.id}`,
    tool,
    level: LEVEL(def.tier),
    xp: String(def.xp),
    duration: `${def.targetMinutes ?? 30} min`,
    title,
    brief: def.client.brief.join(' '),
    storyline: def.client.brief.join(' '),
    criteria: JSON.stringify(def.workspace.deliverables),
    deliverables: JSON.stringify(def.workspace.deliverables),
    stakeholder_name: def.client.name,
    stakeholder_title: def.client.business,
    stakeholder_question: def.summary,
    stakeholder_org: def.client.business,
    starter_data: JSON.stringify(datasetFor(data)),
    return_to: returnTo,
  });
  if (def.workspace.checks?.length) q.set('checks', JSON.stringify(def.workspace.checks));
  return { url: `${WORKSPACE_URL()}?${q.toString()}`, title };
}

/** Checks BGAP's completion record for this mission; pays once when it passes. */
export async function verifyWorkspace(userId: string, def: MissionDef) {
  if (!def.workspace) throw new Error('Not a workspace case.');
  if (!supabaseReady()) return { completed: false as const, reason: 'Workspace results need the BGAP database.' };
  const { supabaseAdmin } = await import('@/server/db/supabase');
  const title = workspaceTitle(def);
  const { data: row, error } = await supabaseAdmin
    .from('challenge_completions')
    .select('score, completed_at')
    .eq('user_id', userId)
    .eq('challenge_title', title)
    .maybeSingle();
  if (error) throw new Error(`Could not read your workspace result: ${error.message}`);
  if (!row) return { completed: false as const, reason: 'No submission from the workspace yet. Finish the tasks there and press Submit.' };
  const score = Number(row.score ?? 0);
  const pass = def.workspace.passScore ?? def.passMark ?? 60;
  if (score < pass) return { completed: false as const, reason: `Your workspace score was ${score}; ${def.client.name} needs ${pass}+.`, score };
  const { created } = await creditMissionReward({ userId, missionId: def.id, amount: def.pay, xp: def.xp, reason: `Paid by ${def.client.business}` });
  await supabaseAdmin.from('workspace_launches').update({ verified_at: new Date().toISOString(), score }).eq('user_id', userId).eq('mission_id', def.id);
  return { completed: true as const, score, alreadyPaid: !created };
}
