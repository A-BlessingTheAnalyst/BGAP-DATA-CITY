// Phase E: reputation, derived — never stored separately. It's a pure function of two things the
// server already decides: which missions are public (tier, district) and which the player has
// completed (the wallet ledger). Nothing here can be faked client-side to unlock anything
// money-related; it only decides what the HUD shows and which jobs look "ready for you".
import type { PublicMission } from './types/content';
import type { DistrictId } from '../features/game/world/kit/cityPlan';

export interface RankDef { min: number; label: string }

/** Cadet → Partner, matching masterprompt §11 Phase E. */
export const RANKS: RankDef[] = [
  { min: 0, label: 'Cadet Analyst' },
  { min: 20, label: 'Trainee Analyst' },
  { min: 40, label: 'Analyst' },
  { min: 65, label: 'Senior Analyst' },
  { min: 85, label: 'Partner' },
];

export function rankFor(score: number): string {
  let label = RANKS[0].label;
  for (const r of RANKS) if (score >= r.min) label = r.label;
  return label;
}

/** Points a completed mission adds to its district's reputation, by tier. */
const TIER_POINTS = [0, 15, 25, 35, 45, 60]; // index by tier 1–5

export interface DistrictReputation { district: DistrictId; score: number; rank: string; done: number }

/** Reputation per district the player has worked in, plus an overall score (average, capped at 100). */
export function reputationByDistrict(missions: PublicMission[], completed: string[]): DistrictReputation[] {
  const done = new Set(completed);
  const byDistrict = new Map<DistrictId, number>();
  for (const m of missions) {
    if (!done.has(m.id) || m.location.remote) continue;
    const d = m.location.district as DistrictId;
    byDistrict.set(d, (byDistrict.get(d) ?? 0) + (TIER_POINTS[m.tier] ?? 15));
  }
  return [...byDistrict.entries()]
    .map(([district, raw]) => ({ district, score: Math.min(100, raw), rank: rankFor(Math.min(100, raw)), done: missions.filter((m) => done.has(m.id) && !m.location.remote && m.location.district === district).length }))
    .sort((a, b) => b.score - a.score);
}

/** One overall score across every district worked in (simple average), for the HUD title. */
export function overallReputation(missions: PublicMission[], completed: string[]): { score: number; rank: string } {
  const rows = reputationByDistrict(missions, completed);
  const score = rows.length ? Math.round(rows.reduce((s, r) => s + r.score, 0) / rows.length) : 0;
  return { score, rank: rankFor(score) };
}

/** Tier N+1 jobs in a district "feel" ready once you've built some reputation there (tier 1 is always open). */
export function tierReadyIn(tier: number, district: DistrictId, missions: PublicMission[], completed: string[]): boolean {
  if (tier <= 1) return true;
  const row = reputationByDistrict(missions, completed).find((r) => r.district === district);
  return (row?.score ?? 0) >= (tier - 2) * 20;
}

export const DISTRICT_NAME: Record<DistrictId, string> = {
  market: 'Market Boulevard', finance: 'Finance Row', tech: 'Tech Park', gardens: 'Ilé Gardens', academy: 'Academy Quarter', gateway: 'City Gateway',
};
