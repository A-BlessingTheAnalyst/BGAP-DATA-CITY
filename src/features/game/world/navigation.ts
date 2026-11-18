'use client';
import { useMemo } from 'react';
import { useGameState } from '../engine/GameState';
import { useCareerStore } from '../ui/phone/useCareer';
import type { PublicMission } from '@/shared/types/content';

// One source of truth for "where should the player go next", shared by the world waypoint,
// the minimap, the full city map and the GPS route.

export interface NavTarget { pos: [number, number, number]; label: string; kind: 'mission' | 'custom' }

/** Evidence a mission's findings need that the player hasn't picked up yet. */
export function missingEvidence(m: PublicMission, found: string[]) {
  const needed = new Set(m.findings.map((f) => f.evidence).filter(Boolean));
  return (m.evidence ?? []).filter((e) => needed.has(e.id) && !found.includes(`${m.id}:${e.id}`));
}

/** The next stop for a tracked in-world mission: the client, then any evidence the findings need, then their records. Null once paid. */
export function missionStop(m: PublicMission | undefined, s: { completedMissions: string[]; talkedTo: string[]; missionState: string; foundEvidence?: string[] }): NavTarget | null {
  if (!m || m.location.remote || !m.location.npc || s.completedMissions.includes(m.id)) return null;
  const met = s.talkedTo.includes(m.id) || (m.id === 'ch1_cafe_revenue_mystery' && s.missionState !== 'available');
  if (!met) return { pos: m.location.npc, label: m.client.name, kind: 'mission' };
  const clue = missingEvidence(m, s.foundEvidence ?? [])[0];
  if (clue) return { pos: clue.position, label: `Find: ${clue.title}`, kind: 'mission' };
  return m.location.workstation
    ? { pos: m.location.workstation, label: `${m.client.name}'s records`, kind: 'mission' }
    : { pos: m.location.npc, label: m.client.name, kind: 'mission' };
}

/** The player's own map pin wins over the tracked job. */
export function useNavTarget(): NavTarget | null {
  const missions = useCareerStore((s) => s.missions);
  const trackedId = useGameState((s) => s.trackedMissionId);
  const completedMissions = useGameState((s) => s.completedMissions);
  const talkedTo = useGameState((s) => s.talkedTo);
  const missionState = useGameState((s) => s.missionState);
  const custom = useGameState((s) => s.customWaypoint);
  const foundEvidence = useGameState((s) => s.foundEvidence);
  return useMemo(() => {
    if (custom) return { pos: [custom[0], 0, custom[1]], label: 'Map pin', kind: 'custom' };
    return missionStop(missions?.find((m) => m.id === trackedId), { completedMissions, talkedTo, missionState, foundEvidence });
  }, [custom, missions, trackedId, completedMissions, talkedTo, missionState, foundEvidence]);
}

/** Every in-world client, for map icons. */
export function useMapClients() {
  const missions = useCareerStore((s) => s.missions);
  const completed = useGameState((s) => s.completedMissions);
  return useMemo(
    () => (missions ?? []).filter((m) => !m.location.remote && m.location.npc).map((m) => ({ id: m.id, name: m.client.name, business: m.client.business, pos: m.location.npc!, done: completed.includes(m.id) })),
    [missions, completed],
  );
}
