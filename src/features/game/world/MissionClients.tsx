'use client';
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { useCareerStore } from '../ui/phone/useCareer';
import { useGameState } from '../engine/GameState';
import { InteractionTrigger } from '../physics/InteractionTrigger';
import { WaypointMarker } from '../missions/WaypointMarker';
import { CastMember } from './kit/CastMember';
import { CHARACTERS } from './kit/characters';
import { Box } from './kit/parts';
import type { EvidenceDef, PublicMission } from '@/shared/types/content';
import { missionStop } from './navigation';

// Puts every in-world client from the mission files into the city: their character, a talk
// trigger and their workstation. Chapter 1 (Mama Bisi) keeps its hand-built scene objects.

const HAND_BUILT = new Set(['ch1_cafe_revenue_mystery']);

/** Face the nearest road: the boulevard runs north–south at x≈0, the cross street east–west at z≈0. */
function facingRoad([x, , z]: [number, number, number]) {
  if (Math.abs(x) < 12 && Math.abs(x) <= Math.abs(z)) return x < 0 ? Math.PI / 2 : -Math.PI / 2;
  return z < 0 ? 0 : Math.PI;
}

function Client({ m }: { m: PublicMission }) {
  const npc = m.location.npc!;
  const ws = m.location.workstation;
  const def = CHARACTERS.find((c) => c.id === m.client.character) ?? CHARACTERS.find((c) => c.role === 'Crowd')!;
  const talking = useGameState((s) => s.isDialogueActive && s.activeNpcId === `client:${m.id}`);
  return (
    <>
      <group position={npc} rotation={[0, facingRoad(npc), 0]}>
        <CastMember def={def} action={talking ? 'Talk' : 'Idle'} />
      </group>
      <InteractionTrigger target={{ id: `client:${m.id}`, type: 'npc', label: m.client.name, actionText: `Talk to ${m.client.name}`, position: npc, radius: 2.6 }} />
      {ws && (
        <group position={ws}>
          {/* A folding table with the client's laptop. */}
          <Box size={[1.2, 0.05, 0.7]} position={[0, 0.75, 0]} color="#6B4226" />
          {[[-0.5, -0.28], [0.5, -0.28], [-0.5, 0.28], [0.5, 0.28]].map(([x, z], i) => <Box key={i} size={[0.05, 0.75, 0.05]} position={[x, 0.375, z]} color="#2B2F36" />)}
          <Box size={[0.4, 0.02, 0.28]} position={[0, 0.79, 0]} color="#2B2F36" metal={0.6} />
          <Box size={[0.4, 0.26, 0.02]} position={[0, 0.93, -0.13]} rotation={[-0.25, 0, 0]} color="#0F1626" emissive="#00B8C9" emissiveIntensity={0.8} />
          <InteractionTrigger target={{ id: `ws:${m.id}`, type: 'workstation', label: `${m.client.business} records`, actionText: `Open ${m.client.name}'s records [E]`, position: ws, radius: 2 }} />
        </group>
      )}
    </>
  );
}

/** A clue lying in the world: a book or slip on a small crate, glowing until you've read it. */
function EvidenceProp({ m, e, found }: { m: PublicMission; e: EvidenceDef; found: boolean }) {
  const glow = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (glow.current) glow.current.scale.setScalar(1 + Math.sin(clock.getElapsedTime() * 3) * 0.12);
  });
  const [x, y, z] = e.position;
  const top = Math.max(0, y);
  return (
    <group position={[x, 0, z]}>
      {top > 0.05 && <Box size={[0.55, top, 0.45]} position={[0, top / 2, 0]} color="#7A5A3A" />}
      {e.prop === 'book' ? (
        <>
          <Box size={[0.34, 0.05, 0.26]} position={[0, top + 0.025, 0]} color="#7B2D26" />
          <Box size={[0.32, 0.02, 0.24]} position={[0.01, top + 0.06, 0]} color="#F2E8D5" />
        </>
      ) : (
        <Box size={[0.12, 0.01, 0.2]} position={[0, top + 0.01, 0]} rotation={[0, 0.5, 0]} color="#F7F4EC" />
      )}
      {!found && (
        <mesh ref={glow} position={[0, top + 0.35, 0]}>
          <octahedronGeometry args={[0.09, 0]} />
          <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={2} />
        </mesh>
      )}
      <InteractionTrigger target={{ id: `evidence:${m.id}:${e.id}`, type: 'evidence', label: e.title, actionText: found ? `Read again: ${e.title}` : `Pick up: ${e.title}`, position: e.position, radius: 1.8 }} />
    </group>
  );
}

export function MissionClients() {
  const missions = useCareerStore((s) => s.missions);
  const trackedId = useGameState((s) => s.trackedMissionId);
  const talkedTo = useGameState((s) => s.talkedTo);
  const completedMissions = useGameState((s) => s.completedMissions);
  const missionState = useGameState((s) => s.missionState);
  const foundEvidence = useGameState((s) => s.foundEvidence);
  // A custom map pin replaces the job marker (CustomWaypoint draws it).
  const pinned = useGameState((s) => s.customWaypoint !== null);
  if (!missions) return null;
  const inWorld = missions.filter((m) => !m.location.remote && m.location.npc);
  // Waypoint: the client first, then their workstation; nothing once it's paid.
  const target = pinned ? null : missionStop(inWorld.find((m) => m.id === trackedId), { completedMissions, talkedTo, missionState, foundEvidence });
  return (
    <>
      {inWorld.filter((m) => !HAND_BUILT.has(m.id)).map((m) => <Client key={m.id} m={m} />)}
      {/* Field evidence stays in the world until the job is paid. */}
      {inWorld.filter((m) => !completedMissions.includes(m.id)).flatMap((m) => (m.evidence ?? []).map((e) => (
        <EvidenceProp key={`${m.id}:${e.id}`} m={m} e={e} found={foundEvidence.includes(`${m.id}:${e.id}`)} />
      )))}
      {target && <WaypointMarker position={[target.pos[0], 2.6, target.pos[2]]} label={target.label} />}
    </>
  );
}
