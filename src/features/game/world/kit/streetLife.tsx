'use client';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Group, MathUtils, Mesh, MeshBasicMaterial, PlaneGeometry, Vector3 } from 'three';
import { RigidBody, CuboidCollider, RapierRigidBody, useRapier } from '@react-three/rapier';
import { init as initRecast, Crowd, NavMeshQuery, CrowdAgent } from 'recast-navigation';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import { EntityManager, FollowPathBehavior, Path, Vehicle, Vector3 as YVec } from 'yuka';
import { CHARACTERS, CharacterDef, Outfit, Person } from './characters';
import { CastMember } from './CastMember';
import type { Body, Hair } from './CharacterModel';
import { INTERSECTIONS, HALF_ROAD } from './cityPlan';
import { signalPhase, signalBrakeFactor, isBlockedByPlayer, stepBlockState, lampColour, type BlockState } from './trafficLogic';
import { playerRuntime, playerNudge, driveRuntime } from '../../characters/PlayerCharacter';
import { pushBark } from '../barks';
import { useGameState } from '../../engine/GameState';
import { interactionTargets } from '../../physics/InteractionTrigger';
import { runtimeInput } from '../../input/InputManager';
import { usePlayerDef } from '../../ui/wardrobe/useWardrobe';

const FEMALE_HAIR: Hair[] = ['Hair_BuzzedFemale', 'Hair_Buns', 'Hair_Long', 'none'];
const MALE_HAIR: Hair[] = ['Hair_Buzzed', 'Hair_SimpleParted', 'Hair_Beard', 'none'];
import { PALETTE } from './palette';

const CROWD = CHARACTERS.filter((c) => c.role === 'Crowd');
const FABRICS = Object.values(PALETTE.fabric);

/** Crowd archetype i with its own skin tone and clothing colours, so no two walkers match. */
function crowdOutfit(i: number): Outfit {
  const base = CROWD[i % CROWD.length].outfit;
  return { ...base, skin: PALETTE.skin[(i * 3) % PALETTE.skin.length], top: FABRICS[(i * 5 + 2) % FABRICS.length], bottom: base.garment === 'boubou' ? FABRICS[(i * 5 + 2) % FABRICS.length] : FABRICS[(i * 7 + 4) % FABRICS.length] };
}
import { KitModel } from './KitModel';
import { Minibus, Tricycle, Motorcycle } from './vehicles';

// Living streets for a district:
//  • Pedestrians walk a recast-navigation navmesh built from the sidewalks, as a Detour crowd
//    (they steer around each other and pick new destinations when they arrive).
//  • Traffic follows lane loops with yuka steering (FollowPathBehavior), slowing for the car ahead.

export interface Walkway { x: number; z: number; w: number; d: number }

/** Live positions of street life, read by the ambient audio and the minimap (no React state). */
export const streetRuntime = {
  vehicles: [] as { x: number; z: number; speed: number; kind: string }[],
  pedestrians: [] as { x: number; z: number }[],
};

/** Anything with x/z (e.g. the player's runtime position) that the crowd should stay around. */
export interface Focus { x: number; z: number }

// ─────────────────────────────── Pedestrians ───────────────────────────────

let recastReady: Promise<void> | null = null;
const loadRecast = () => (recastReady ??= initRecast());

/**
 * `focus`: keep the crowd around this point. Walkers that drift more than `radius` away are
 * quietly re-placed on the sidewalks 35–70 m from it, so a big city still feels busy where you are.
 */
export function Pedestrians({ walkways, count = 18, focus, radius = 85 }: { walkways: Walkway[]; count?: number; focus?: Focus; radius?: number }) {
  const [crowd, setCrowd] = useState<{ crowd: Crowd; query: NavMeshQuery; agents: CrowdAgent[] } | null>(null);
  // The frame loop reads the live crowd from a ref, so it can never touch one that was destroyed.
  const live = useRef<{ crowd: Crowd; query: NavMeshQuery; agents: CrowdAgent[] } | null>(null);
  const refs = useRef<(Group | null)[]>([]);
  const cast = useMemo<CharacterDef[]>(() => Array.from({ length: count }, (_, i) => {
    const base = CROWD[i % CROWD.length];
    const outfit = crowdOutfit(i);
    // Dresses go on the female body; hairstyles are matched to the body they were made for.
    const body: Body = outfit.garment === 'boubou' ? 'female' : i % 2 ? 'male' : 'female';
    const hair: Hair = body === 'female'
      ? (FEMALE_HAIR.includes(base.look.hair ?? 'none') ? base.look.hair! : FEMALE_HAIR[i % FEMALE_HAIR.length])
      : (MALE_HAIR.includes(base.look.hair ?? 'none') ? base.look.hair! : MALE_HAIR[i % MALE_HAIR.length]);
    return { ...base, id: `${base.id}_${i}`, outfit, look: { ...base.look, body, hair, skinTone: 0.85 + ((i * 7) % 5) * 0.08 } };
  }), [count]);
  // Per-agent, mutated every frame (no re-render) so each walker's foot-fall rate tracks its
  // actual recast speed instead of always playing the walk clip at full rate.
  const animScales = useMemo(() => Array.from({ length: count }, () => ({ current: 1 })), [count]);

  useEffect(() => {
    let disposed = false;
    let built: { crowd: Crowd; query: NavMeshQuery; destroyMesh: () => void } | null = null;
    loadRecast().then(() => {
      if (disposed) return;
      const meshes = walkways.map((w) => {
        const m = new Mesh(new PlaneGeometry(w.w, w.d), new MeshBasicMaterial());
        m.rotation.x = -Math.PI / 2;
        m.position.set(w.x, 0.06, w.z);
        m.updateMatrixWorld(true);
        return m;
      });
      // Coarser cells on big maps keep the build fast (a city-wide sidewalk net is ~0.3 km²).
      const area = walkways.reduce((n, w) => n + w.w * w.d, 0);
      const result = threeToSoloNavMesh(meshes, { cs: area > 20000 ? 0.45 : 0.3, ch: 0.2, walkableRadius: 1, walkableHeight: 9, maxEdgeLen: 24 });
      meshes.forEach((m) => m.geometry.dispose());
      if (!result.success) return;
      const crowd = new Crowd(result.navMesh, { maxAgents: count, maxAgentRadius: 0.5 });
      const query = new NavMeshQuery(result.navMesh);
      const agents: CrowdAgent[] = [];
      for (let i = 0; i < count; i++) {
        const start = focus
          ? query.findRandomPointAroundCircle({ x: focus.x, y: 0, z: focus.z }, 45).randomPoint
          : query.findRandomPoint().randomPoint;
        const agent = crowd.addAgent(start, { radius: 0.35, height: 1.75, maxSpeed: 1.1 + (i % 4) * 0.12, maxAcceleration: 4, separationWeight: 2 });
        agent.requestMoveTarget(query.findRandomPointAroundCircle(start, 40).randomPoint);
        agents.push(agent);
      }
      built = { crowd, query, destroyMesh: () => result.navMesh.destroy() };
      live.current = { crowd, query, agents };
      setCrowd(live.current);
    });
    return () => {
      disposed = true;
      live.current = null;
      setCrowd(null);
      built?.crowd.destroy();
      built?.query.destroy();
      built?.destroyMesh();
    };
  }, [walkways, count, focus]);

  useFrame(({ clock }, dt) => {
    const c = live.current;
    if (!c) return;
    c.crowd.update(Math.min(dt, 0.05));
    streetRuntime.pedestrians.length = c.agents.length;
    c.agents.forEach((a, i) => {
      const g = refs.current[i];
      let p = a.interpolatedPosition;
      streetRuntime.pedestrians[i] = { x: p.x, z: p.z };
      if (!g) return;
      if (focus && (p.x - focus.x) ** 2 + (p.z - focus.z) ** 2 > radius * radius) {
        // Re-place far walkers on a sidewalk ring around the focus (out of the camera's near field).
        const angle = Math.random() * Math.PI * 2, r = 35 + Math.random() * 35;
        const near = c.query.findClosestPoint({ x: focus.x + Math.cos(angle) * r, y: 0, z: focus.z + Math.sin(angle) * r }, { halfExtents: { x: 30, y: 4, z: 30 } });
        if (near.success) {
          a.teleport(near.point);
          a.requestMoveTarget(c.query.findRandomPointAroundCircle(near.point, 40).randomPoint);
          p = a.interpolatedPosition;
        }
      }
      streetRuntime.pedestrians[i] = { x: p.x, z: p.z };
      const v = a.velocity();
      g.position.set(p.x, p.y, p.z);
      if (v.x * v.x + v.z * v.z > 0.01) g.rotation.y = Math.atan2(v.x, v.z);
      // Walk_Loop is authored around ~1.3 m/s; scale it to this agent's actual ground speed so it
      // never looks like it's walking in place when steering slows it (crowding, re-targeting).
      animScales[i].current = Math.min(1.3, Math.max(0.2, Math.hypot(v.x, v.z) / 1.3));
      const t = a.target();
      if ((t.x - p.x) ** 2 + (t.z - p.z) ** 2 < 1) a.requestMoveTarget(c.query.findRandomPointAroundCircle(p, 40).randomPoint);

      // A sprinting player who barrels into a walker gets shouted at and sidestepped.
      const pl = playerRuntime.position;
      const dx = p.x - pl.x, dz = p.z - pl.z;
      if (playerRuntime.speed > 5 && dx * dx + dz * dz < 1.1) {
        pushBark('bumped', [p.x, p.y + 1.6, p.z], `ped${i}`, clock.elapsedTime, 2.5);
        const side = new Vector3(-dz, 0, dx).normalize().multiplyScalar(2.5);
        a.requestMoveTarget({ x: p.x + side.x, y: p.y, z: p.z + side.z });
      }
    });
  });

  if (!crowd) return null;
  return (
    <>
      {cast.map((c, i) => (
        <group key={i} ref={(g) => { refs.current[i] = g; }}>
          <CastMember def={c} walking speedScaleRef={animScales[i]} />
        </group>
      ))}
    </>
  );
}

// ───────────────────────────────── Traffic ─────────────────────────────────

export interface Lane { points: [number, number][]; vehicles: ('taxi' | 'sedan' | 'suv' | 'van' | 'danfo' | 'keke' | 'okada')[]; speed: number }

/** Rough footprint (width, height, length) in metres, for the player collider and the "blocked" check. */
const FOOTPRINT: Record<Lane['vehicles'][number], [number, number, number]> = {
  taxi: [1.8, 1.7, 4.4], sedan: [1.8, 1.6, 4.5], suv: [2, 2, 4.7], van: [2, 2.3, 5.4],
  danfo: [2, 2.4, 6], keke: [1.4, 2.2, 2.4], okada: [0.8, 1.3, 2],
};

function VehicleModel({ kind }: { kind: Lane['vehicles'][number] }): ReactNode {
  switch (kind) {
    case 'danfo': return <Minibus />;
    case 'keke': return <Tricycle />;
    case 'okada': return <Motorcycle />;
    default: return <KitModel kit={`kenney-cars/${kind}`} />;
  }
}

const KIND_LABEL: Record<Lane['vehicles'][number], string> = {
  taxi: 'Taxi', sedan: 'Sedan', suv: 'SUV', van: 'Van', danfo: 'Danfo', keke: 'Keke', okada: 'Okada',
};

/** A cheap procedural figure seated in the driver's spot (every ambient vehicle has a visible
 * driver now — Owner feedback 18 Nov 2026, masterprompt.md §12.2). Full rigged CastMember bodies
 * are reserved for the player's own car (one instance); traffic can have 40+, so this stays light.
 * Owner feedback 19 Nov 2026: the first pass positioned the group well above the vehicle's own
 * floor (scaled off total vehicle height), so a standing figure's hip ended up near the roofline —
 * "drivers standing inside the car". `seated` bends the legs out of a straight dangle (see
 * characters.tsx) and this now sits the hip pivot near the vehicle's actual floor, not its roof. */
function Driver({ kind, seed }: { kind: Lane['vehicles'][number]; seed: number }) {
  return (
    <group position={[kind === 'okada' ? 0 : -0.32, 0.05, kind === 'danfo' || kind === 'van' ? 0.6 : 0.1]} scale={0.86}>
      <Person outfit={crowdOutfit(seed)} seated />
    </group>
  );
}

/** Four-way junctions only (the ones that get traffic lights), each with a fixed, varied phase offset. */
const FOUR_WAY = INTERSECTIONS.filter((i) => i.arms === 4).map((i, k) => ({ ...i, offset: (k * 3.7) % 20 }));
const SIGNAL_ZONE = 14; // metres ahead a vehicle starts checking a light
const STOP_LINE_PAD = 1.2;

export function Traffic({ lanes }: { lanes: Lane[] }) {
  const { world } = useRapier();
  const refs = useRef<(Group | null)[]>([]);
  const bodies = useRef<(RapierRigidBody | null)[]>([]);
  const flat = useMemo(() => lanes.flatMap((l, li) => l.vehicles.map((v, vi) => ({ kind: v, lane: li, slot: vi, count: l.vehicles.length }))), [lanes]);
  // One "blocked by the player" state machine per vehicle (streetLife.trafficLogic.stepBlockState).
  const block = useRef<BlockState[]>([]);
  const playerDef = usePlayerDef();

  // Owner feedback 18 Nov 2026 (masterprompt.md §12.1/§12.3): ambient traffic is now jackable, not
  // just owned/dealership cars. One shared character controller drives whichever vehicle is jacked
  // (only one at a time), reusing DrivableCar.tsx's ground-vehicle kinematics.
  const jackController = useRef<ReturnType<typeof world.createCharacterController>>();
  const jackSpeed = useRef(0);
  const jackYaw = useRef(0);
  const prevJackIdx = useRef(-1);
  // Which vehicle (if any) the player is currently jacked into — reactive only on the rare
  // transition (entering/leaving a car), so it's safe to drive the render from a hook here.
  const drivingVehicleId = useGameState((s) => (s.isDriving ? s.drivingVehicleId : null));
  const jackedRenderIdx = drivingVehicleId?.startsWith('traffic:') ? Number(drivingVehicleId.slice('traffic:'.length)) : -1;

  useEffect(() => {
    const c = world.createCharacterController(0.02);
    c.enableSnapToGround(0.3);
    jackController.current = c;
    return () => { world.removeCharacterController(c); jackController.current = undefined; };
  }, [world]);

  // Every ambient vehicle gets an InteractionTarget directly in the module-level registry (not the
  // <InteractionTrigger> component) so its live position can be mutated in place every frame below,
  // with zero extra React re-renders for 40+ moving targets.
  useEffect(() => {
    const ids = flat.map((_, i) => `vehicle:traffic:${i}`);
    flat.forEach((f, i) => {
      interactionTargets.set(ids[i], {
        id: ids[i], type: 'vehicle', label: KIND_LABEL[f.kind],
        actionText: `Jack this ${KIND_LABEL[f.kind]} [E]`,
        position: [0, 0.6, 0], radius: 2.6,
      });
    });
    return () => { ids.forEach((id) => interactionTargets.delete(id)); };
  }, [flat]);

  const sim = useMemo(() => {
    const manager = new EntityManager();
    const vehicles = flat.map(({ lane, slot, count }) => {
      const L = lanes[lane];
      const pts = L.points, n = pts.length;
      // Spread vehicles evenly along the loop perimeter.
      const segs = pts.map((p, k) => Math.hypot(pts[(k + 1) % n][0] - p[0], pts[(k + 1) % n][1] - p[1]));
      let along = (slot / count) * segs.reduce((x, y) => x + y, 0), k = 0;
      while (along > segs[k]) { along -= segs[k]; k = (k + 1) % n; }
      const t = along / segs[k], [ax, az] = pts[k], [bx, bz] = pts[(k + 1) % n];
      const path = new Path();
      path.loop = true;
      for (let j = 1; j <= n; j++) {
        const [x, z] = pts[(k + j) % n];
        path.add(new YVec(x, 0, z));
      }
      const v = new Vehicle();
      v.maxSpeed = L.speed * (0.92 + (slot % 3) * 0.06);
      v.maxForce = 18;
      v.mass = 1.2;
      v.position.set(ax + (bx - ax) * t, 0, az + (bz - az) * t);
      v.steering.add(new FollowPathBehavior(path, 2.5));
      manager.add(v);
      return v;
    });
    block.current = vehicles.map(() => ({ phase: 'none', timer: 0 }));
    return { manager, vehicles };
  }, [flat, lanes]);

  useFrame(({ camera, clock }, dt) => {
    const d = Math.min(dt, 0.05), t = clock.elapsedTime, p = playerRuntime.position;
    const s = useGameState.getState();
    const jackIdx = s.isDriving && s.drivingVehicleId?.startsWith('traffic:') ? Number(s.drivingVehicleId.slice('traffic:'.length)) : -1;
    if (jackIdx !== prevJackIdx.current) {
      if (jackIdx >= 0) {
        const jv = sim.vehicles[jackIdx];
        jackYaw.current = Math.atan2(jv.velocity.x, jv.velocity.z) || 0;
        jackSpeed.current = Math.hypot(jv.velocity.x, jv.velocity.z);
      }
      prevJackIdx.current = jackIdx;
    }
    sim.vehicles.forEach((v, vi) => {
      // The jacked vehicle is driven by the player below, not by yuka's steering/braking/signals.
      if (vi === jackIdx) return;
      let brake = 1;
      // Slow down behind a vehicle that is close ahead in the direction of travel.
      sim.vehicles.forEach((o, oi) => {
        if (o === v || flat[oi].lane !== flat[vi].lane) return;
        const dx = o.position.x - v.position.x, dz = o.position.z - v.position.z;
        const dist2 = dx * dx + dz * dz;
        if (dist2 > 100) return;
        const sp = Math.hypot(v.velocity.x, v.velocity.z) || 1;
        const ahead = (dx * v.velocity.x + dz * v.velocity.z) / sp;
        if (ahead > 0 && ahead < 9 && Math.abs(dx * v.velocity.z - dz * v.velocity.x) / sp < 2.2) brake = Math.min(brake, (ahead - 3) / 6);
      });

      // Stop for a red light ahead (checked against the nearest approaching four-way junction).
      const sp = Math.hypot(v.velocity.x, v.velocity.z) || 1;
      const dirx = v.velocity.x / sp, dirz = v.velocity.z / sp;
      for (const inter of FOUR_WAY) {
        const dx = inter.x - v.position.x, dz = inter.z - v.position.z;
        const along = dx * dirx + dz * dirz;
        const perp = Math.abs(dx * dirz - dz * dirx);
        if (perp > 3 || along <= 0 || along > SIGNAL_ZONE) continue;
        const axis: 'x' | 'z' = Math.abs(dirz) > Math.abs(dirx) ? 'z' : 'x';
        const phase = signalPhase(t, axis, inter.offset);
        brake = Math.min(brake, signalBrakeFactor(phase, along - HALF_ROAD - STOP_LINE_PAD));
        break;
      }
      if (brake < 1) v.velocity.multiplyScalar(Math.max(0, brake));

      // Blocked-by-player escalation: brake (0s) → horn (~1.5s) → shout (~4s) → push (~9s).
      const blocked = isBlockedByPlayer(v.position.x, v.position.z, dirx, dirz, p.x, p.z);
      const prevPhase = block.current[vi]?.phase ?? 'none';
      const next = stepBlockState(block.current[vi] ?? { phase: 'none', timer: 0 }, blocked, d);
      block.current[vi] = next;
      if (next.phase !== 'none') v.velocity.multiplyScalar(0.1); // held at a near-stop while blocked
      // Each situation gets its own cooldown key: an edge trigger on one phase must never be
      // suppressed by another phase's cooldown on the same vehicle (horn then shout then push).
      const vehId = `veh${vi}`;
      if (next.phase === 'horn' && prevPhase !== 'horn') pushBark('horn', [v.position.x, 1, v.position.z], `${vehId}:horn`, t, 3);
      if (next.phase === 'shout' && prevPhase !== 'shout') pushBark('shout', [v.position.x, 1, v.position.z], `${vehId}:shout`, t, 5);
      if (next.phase === 'push' && prevPhase !== 'push') {
        pushBark('push', [v.position.x, 1, v.position.z], `${vehId}:push`, t, 2.5);
        // A gentle shove out of the lane, away from the vehicle.
        const away = new Vector3(p.x - v.position.x, 0, p.z - v.position.z);
        if (away.lengthSq() > 0.0001) { away.normalize().multiplyScalar(2.2); playerNudge.x += away.x; playerNudge.z += away.z; }
      }
      if (prevPhase !== 'none' && next.phase === 'none') pushBark('thanks', [v.position.x, 1, v.position.z], `${vehId}:thanks`, t, 6);
    });
    sim.manager.update(d);

    // Player-controlled movement for the jacked vehicle, written back into its yuka state so
    // releasing it (E) hands smoothly back to FollowPathBehavior from wherever it ends up.
    if (jackIdx >= 0 && bodies.current[jackIdx]) {
      const jv = sim.vehicles[jackIdx];
      const kind = flat[jackIdx].kind;
      const maxSpeed = kind === 'okada' ? 10 : kind === 'danfo' || kind === 'van' ? 7 : 9;
      const throttle = (runtimeInput.forward ? 1 : 0) - (runtimeInput.backward ? 1 : 0);
      const steer = (runtimeInput.left ? 1 : 0) - (runtimeInput.right ? 1 : 0);
      const boost = runtimeInput.sprint ? 1 : 0.6;
      if (throttle !== 0) jackSpeed.current = MathUtils.clamp(jackSpeed.current + throttle * 6 * d, -maxSpeed * 0.5, maxSpeed * boost);
      else jackSpeed.current = MathUtils.damp(jackSpeed.current, 0, 2.5, d);
      if (Math.abs(jackSpeed.current) > 0.3) jackYaw.current += steer * 1.8 * d * Math.sign(jackSpeed.current) * Math.min(1, Math.abs(jackSpeed.current) / 3);
      const dx = Math.sin(jackYaw.current) * jackSpeed.current * d, dz = Math.cos(jackYaw.current) * jackSpeed.current * d;
      let mx = dx, mz = dz;
      const jc = jackController.current;
      if (jc) {
        jc.computeColliderMovement(bodies.current[jackIdx]!.collider(0), { x: dx, y: -0.3 * d, z: dz });
        const m = jc.computedMovement();
        mx = m.x; mz = m.z;
        if (Math.abs(m.x) < Math.abs(dx) * 0.4 || Math.abs(m.z) < Math.abs(dz) * 0.4) jackSpeed.current *= 0.3; // hit something
      }
      jv.position.x += mx;
      jv.position.z += mz;
      jv.velocity.set(mx / d, 0, mz / d);
      driveRuntime.position.set(jv.position.x, FOOTPRINT[kind][1] * 0.5 + 0.3, jv.position.z);
      driveRuntime.rotationY = jackYaw.current;
    }

    streetRuntime.vehicles.length = sim.vehicles.length;
    sim.vehicles.forEach((v, i) => {
      streetRuntime.vehicles[i] = { x: v.position.x, z: v.position.z, speed: Math.sqrt(v.getSpeedSquared()), kind: flat[i].kind };
      const target = interactionTargets.get(`vehicle:traffic:${i}`);
      if (target) { target.position[0] = v.position.x; target.position[2] = v.position.z; }
      const g = refs.current[i];
      if (g) {
        // Vehicles are many small meshes; past 160 m they are specks in the haze.
        g.visible = (v.position.x - camera.position.x) ** 2 + (v.position.z - camera.position.z) ** 2 < 160 * 160;
        g.position.set(v.position.x, 0, v.position.z);
        if (i === jackIdx) g.rotation.y = jackYaw.current;
        else if (v.getSpeedSquared() > 0.05) g.rotation.y = Math.atan2(v.velocity.x, v.velocity.z);
      }
      const b = bodies.current[i];
      if (b) {
        b.setNextKinematicTranslation({ x: v.position.x, y: FOOTPRINT[flat[i].kind][1] / 2, z: v.position.z });
        if (i === jackIdx || v.getSpeedSquared() > 0.05) {
          const half = (g?.rotation.y ?? 0) / 2;
          b.setNextKinematicRotation({ x: 0, y: Math.sin(half), z: 0, w: Math.cos(half) });
        }
      }
    });
  });

  return (
    <>
      {flat.map((f, i) => {
        const [w, h, len] = FOOTPRINT[f.kind];
        return (
          <group key={i} ref={(g) => { refs.current[i] = g; }}>
            <VehicleModel kind={f.kind} />
            {i === jackedRenderIdx ? (
              <group position={[f.kind === 'okada' ? 0 : -0.3, 0.15, f.kind === 'danfo' || f.kind === 'van' ? 0.6 : 0.1]} scale={0.95}>
                <CastMember def={playerDef} action="Drive" />
              </group>
            ) : (
              <Driver kind={f.kind} seed={i} />
            )}
            {/* Kinematic collider so the player can't walk through moving traffic (and the body the
                jacked-vehicle controller above sweeps for collision). */}
            <RigidBody ref={(b) => { bodies.current[i] = b; }} type="kinematicPosition" colliders={false} position={[0, h / 2, 0]}>
              <CuboidCollider args={[w / 2, h / 2, len / 2]} />
            </RigidBody>
          </group>
        );
      })}
    </>
  );
}

/** Lamps at every four-way junction, coloured by the live signal phase (no new geometry: tiny emissive spheres on poles already placed by City.tsx's road tiles). */
export function TrafficLights() {
  const ns = useRef<(Mesh | null)[]>([]);
  const ew = useRef<(Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const safe = useGameState.getState().colorblindSafe;
    FOUR_WAY.forEach((inter, i) => {
      const nsPhase = signalPhase(t, 'z', inter.offset), ewPhase = signalPhase(t, 'x', inter.offset);
      const a = ns.current[i], b = ew.current[i];
      if (a) (a.material as MeshBasicMaterial).color.set(lampColour(nsPhase, safe));
      if (b) (b.material as MeshBasicMaterial).color.set(lampColour(ewPhase, safe));
    });
  });
  return (
    <>
      {FOUR_WAY.map((inter, i) => (
        <group key={i} position={[inter.x, 0, inter.z]}>
          {/* NS lamp (governs roads running along z) sits on the +x corner pole. */}
          <mesh position={[HALF_ROAD + 0.9, 3.1, 0]}>
            <boxGeometry args={[0.06, 2.8, 0.06]} />
            <meshStandardMaterial color="#2B2F36" />
          </mesh>
          <mesh ref={(m) => { ns.current[i] = m; }} position={[HALF_ROAD + 0.9, 4.3, 0]}>
            <sphereGeometry args={[0.16, 10, 10]} />
            <meshBasicMaterial color={new Color('#F87171')} toneMapped={false} />
          </mesh>
          {/* EW lamp (governs roads running along x) sits on the -z corner pole. */}
          <mesh position={[0, 3.1, -HALF_ROAD - 0.9]}>
            <boxGeometry args={[0.06, 2.8, 0.06]} />
            <meshStandardMaterial color="#2B2F36" />
          </mesh>
          <mesh ref={(m) => { ew.current[i] = m; }} position={[0, 4.3, -HALF_ROAD - 0.9]}>
            <sphereGeometry args={[0.16, 10, 10]} />
            <meshBasicMaterial color={new Color('#F87171')} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  );
}
