import type { MissionDef } from '@/shared/types/content';

// Mirrors a passed Data City mission into the BGAP platform (shared Supabase project): one row in
// public.challenge_completions titled "Data City · <title>" plus the XP / challenges_completed
// counters on public.users, via db/migrations/0005's datacity_record_completion(). That makes city
// work count on the BGAP dashboard, leaderboard and portfolio, the same as a workspace challenge.
// Best-effort: the player is already paid in Data City's own ledger, so a sync failure (e.g. the
// migration not run yet) is logged, never surfaced as a failed submission.

const TOOL: Record<MissionDef['skill'], string> = { SQL: 'sql', Python: 'python', Spreadsheets: 'excel', Charts: 'excel', Statistics: 'sql' };
const LEVEL = (tier: number) => (tier <= 1 ? 'Beginner' : tier <= 3 ? 'Intermediate' : 'Advanced');

export async function syncCompletionToBgap(userId: string, def: MissionDef, result: { xpEarned: number; totalScore?: number; score?: number }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !url.startsWith('https://') || url.includes('placeholder')) return false;
  try {
    const { supabaseAdmin } = await import('@/server/db/supabase');
    const score = Math.round(Number(result.totalScore ?? result.score ?? 100));
    const { data, error } = await supabaseAdmin.rpc('datacity_record_completion', {
      p_user_id: userId,
      p_mission_id: def.id,
      p_title: def.title,
      p_tool: TOOL[def.skill] ?? 'sql',
      p_level: LEVEL(def.tier),
      p_xp: result.xpEarned,
      p_score: Number.isFinite(score) ? score : null,
      p_feedback: `Solved for ${def.client.business} in Data City.`,
    });
    if (error) { console.warn('[bgapSync] completion not mirrored:', error.message); return false; }
    return data === true;
  } catch (e) {
    console.warn('[bgapSync] completion not mirrored:', e instanceof Error ? e.message : e);
    return false;
  }
}
