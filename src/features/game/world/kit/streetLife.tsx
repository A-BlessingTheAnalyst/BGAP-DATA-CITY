'use client';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';
import { init as initRecast, Crowd, NavMeshQuery, CrowdAgent } from 'recast-navigation';
import { threeToSoloNavMesh } from '@recast-navigation/three';
import { EntityManager, FollowPathBehavior, Path, Vehicle, Vector3 as YVec } from 'yuka';
import { CHARACTERS, CharacterDef, Outfit } from './characters';
import { CastMember } from './CastMember';
import type { Body, Hair } from './CharacterModel';

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

  useFrame((_, dt) => {
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
      const t = a.target();
      if ((t.x - p.x) ** 2 + (t.z - p.z) ** 2 < 1) a.requestMoveTarget(c.query.findRandomPointAroundCircle(p, 40).randomPoint);
    });
  });

  if (!crowd) return null;
  return (
    <>
      {cast.map((c, i) => (
        <group key={i} ref={(g) => { refs.current[i] = g; }}>
          <CastMember def={c} walking />
        </group>
      ))}
    </>
  );
}

// ───────────────────────────────── Traffic ─────────────────────────────────

export interface Lane { points: [number, number][]; vehicles: ('taxi' | 'sedan' | 'suv' | 'van' | 'danfo' | 'keke' | 'okada')[]; speed: number }

function VehicleModel({ kind }: { kind: Lane['vehicles'][number] }): ReactNode {
  switch (kind) {
    case 'danfo': return <Minibus />;
    case 'keke': return <Tricycle />;
    case 'okada': return <Motorcycle />;
    default: return <KitModel kit={`kenney-cars/${kind}`} />;
  }
}

export function Traffic({ lanes }: { lanes: Lane[] }) {
  const refs = useRef<(Group | null)[]>([]);
  const flat = useMemo(() => lanes.flatMap((l, li) => l.vehicles.map((v, vi) => ({ kind: v, lane: li, slot: vi, count: l.vehicles.length }))), [lanes]);

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
    return { manager, vehicles };
  }, [flat, lanes]);


  useFrame(({ camera }, dt) => {
    const d = Math.min(dt, 0.05);
    // Slow down behind a vehicle that is close ahead in the direction of travel.
    sim.vehicles.forEach((v, vi) => {
      let brake = 1;
      sim.vehicles.forEach((o, oi) => {
        if (o === v || flat[oi].lane !== flat[vi].lane) return;
        const dx = o.position.x - v.position.x, dz = o.position.z - v.position.z;
        const dist2 = dx * dx + dz * dz;
        if (dist2 > 100) return;
        const sp = Math.hypot(v.velocity.x, v.velocity.z) || 1;
        const ahead = (dx * v.velocity.x + dz * v.velocity.z) / sp;
        if (ahead > 0 && ahead < 9 && Math.abs(dx * v.velocity.z - dz * v.velocity.x) / sp < 2.2) brake = Math.min(brake, (ahead - 3) / 6);
      });
      if (brake < 1) v.velocity.multiplyScalar(Math.max(0, brake));
    });
    sim.manager.update(d);
    streetRuntime.vehicles.length = sim.vehicles.length;
    sim.vehicles.forEach((v, i) => {
      streetRuntime.vehicles[i] = { x: v.position.x, z: v.position.z, speed: Math.sqrt(v.getSpeedSquared()), kind: flat[i].kind };
      const g = refs.current[i];
      if (!g) return;
      // Vehicles are many small meshes; past 160 m they are specks in the haze.
      g.visible = (v.position.x - camera.position.x) ** 2 + (v.position.z - camera.position.z) ** 2 < 160 * 160;
      g.position.set(v.position.x, 0, v.position.z);
      if (v.getSpeedSquared() > 0.05) g.rotation.y = Math.atan2(v.velocity.x, v.velocity.z);
    });
  });

  return (
    <>
      {flat.map((f, i) => (
        <group key={i} ref={(g) => { refs.current[i] = g; }}>
          <VehicleModel kind={f.kind} />
        </group>
      ))}
    </>
  );
}
