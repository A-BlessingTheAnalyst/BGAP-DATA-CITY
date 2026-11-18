'use client';
import { ReactNode, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { Group, InstancedMesh, Matrix4, MeshStandardMaterial, PlaneGeometry, Quaternion, Vector3 } from 'three';
import { InstancedKit, Placement } from './InstancedKit';
import type { KitRef } from './kitData';
import { Sign, Awning } from './parts';
import * as B from './buildings';
import { PALETTE } from './palette';
import { BLOCKS, CITY_BOUNDS, DISTRICT_INFO, ROAD_TILES, SIDEWALKS, cityPlan, lotRect, type Lot, type LandmarkId } from './cityPlan';

// Renders the whole city from the master plan (cityPlan.ts):
//   roads and sidewalks (instanced), district ground, ~650 library buildings (one InstancedMesh2 per
//   model, BVH-culled), procedural landmarks, street trees and lamps, and every collider.
// Market Boulevard's hand-dressed core is drawn by district.tsx on top of this.

const LANDMARK: Record<LandmarkId, (props: Record<string, string | number>) => ReactNode> = {
  academy: () => <B.AcademyCampus />,
  spire: () => <B.DataSpire />,
  primary: () => <B.PrimarySchool />,
  clinic: () => <B.Clinic />,
  clock: () => <B.ClockTower />,
  apartments: (p) => <B.ApartmentBlock name={String(p.name ?? 'ILÉ GARDENS')} />,
  bank: () => <B.BankBranch />,
  tower_meridian: (p) => <B.OfficeTower company={String(p.company)} />,
  tower_vantage: (p) => <B.OfficeTower company={String(p.company)} />,
  tower_okeke: (p) => <B.OfficeTower company={String(p.company)} />,
  tower_lumen: (p) => <B.OfficeTower company={String(p.company)} />,
  tower_kora: (p) => <B.OfficeTower company={String(p.company)} />,
  techhub: () => <B.TechHub />,
  petrol: () => <B.PetrolStation />,
  gate: () => <B.CityGate />,
};

/**
 * Hides its children beyond `radius` metres from the camera (checked 5×/s). Procedural landmarks and
 * shop signs are dozens of small meshes each; past this range they are haze and not worth the draw calls.
 */
export function DistanceCull({ x, z, radius, children }: { x: number; z: number; radius: number; children: ReactNode }) {
  const ref = useRef<Group>(null);
  const t = useRef(Math.random() * 0.2);
  useFrame(({ camera }, dt) => {
    t.current -= dt;
    if (t.current > 0 || !ref.current) return;
    t.current = 0.2;
    ref.current.visible = (camera.position.x - x) ** 2 + (camera.position.z - z) ** 2 < radius * radius;
  });
  return <group ref={ref}>{children}</group>;
}

function group<T>(xs: T[], key: (x: T) => string) {
  const m = new Map<string, T[]>();
  for (const x of xs) (m.get(key(x)) ?? m.set(key(x), []).get(key(x))!).push(x);
  return m;
}

/** Sidewalk slabs: one instanced mesh for every strip and corner. */
function Sidewalks() {
  const mesh = useMemo(() => {
    const geo = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const mat = new MeshStandardMaterial({ color: PALETTE.ground.paving, roughness: 0.95 });
    const im = new InstancedMesh(geo, mat, SIDEWALKS.length);
    const m = new Matrix4(), q = new Quaternion(), p = new Vector3(), s = new Vector3();
    SIDEWALKS.forEach((r, i) => im.setMatrixAt(i, m.compose(p.set(r.x, 0.06, r.z), q, s.set(r.w, 1, r.d))));
    im.receiveShadow = true;
    im.computeBoundingSphere();
    return im;
  }, []);
  useEffect(() => () => { mesh.geometry.dispose(); (mesh.material as MeshStandardMaterial).dispose(); mesh.dispose(); }, [mesh]);
  return <primitive object={mesh} />;
}

function Roads() {
  const byKind = useMemo(() => {
    const out: Record<string, Placement[]> = { straight: [], crossroad: [], square: [] };
    for (const t of ROAD_TILES) out[t.kind].push({ position: [t.x, 0, t.z], rotationY: t.rotY });
    return out;
  }, []);
  return (
    <>
      <InstancedKit kit="kenney-roads/road-straight" items={byKind.straight} shadows={false} warm={false} />
      <InstancedKit kit="kenney-roads/road-crossroad" items={byKind.crossroad} shadows={false} warm={false} />
      <InstancedKit kit="kenney-roads/road-square" items={byKind.square} shadows={false} warm={false} />
    </>
  );
}

/** Ground: sand under everything, then a district-coloured pad inside each block. */
function Ground() {
  const w = CITY_BOUNDS.maxX - CITY_BOUNDS.minX + 900;
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[w, w]} />
        <meshStandardMaterial color="#CDB896" roughness={1} />
      </mesh>
      {BLOCKS.map((b) => (
        <mesh key={`${b.i}${b.j}`} rotation={[-Math.PI / 2, 0, 0]} position={[b.x, 0.015, b.z]} receiveShadow>
          <planeGeometry args={[b.w, b.d]} />
          <meshStandardMaterial color={b.park ? PALETTE.ground.grass : DISTRICT_INFO[b.district].ground} roughness={1} />
        </mesh>
      ))}
    </>
  );
}

/** Shop sign and awning over the door of a generated shopfront. */
function ShopDressing({ lot }: { lot: Lot }) {
  const s = B.SHOPS[lot.shop! % B.SHOPS.length];
  return (
    <group position={[lot.x, 0, lot.z]} rotation={[0, lot.rotY, 0]}>
      <Sign text={s.text} sub={s.sub} w={Math.min(lot.w * 0.8, 7)} h={1.1} position={[0, 3.6, lot.d / 2 + 0.12]} bg={s.bg} fg={s.fg} lit />
      <Awning w={Math.min(lot.w * 0.7, 6)} position={[0, 3.0, lot.d / 2 + 0.1]} colors={[s.bg, '#F3F1EC']} depth={1.3} />
    </group>
  );
}

export function City({ physics = true }: { physics?: boolean }) {
  const plan = useMemo(() => cityPlan(), []);
  const kitLots = useMemo(() => group(plan.lots.filter((l) => l.kind === 'kit'), (l) => l.kit!), [plan]);
  const props = useMemo(() => group(plan.props, (p) => p.kit), [plan]);
  const landmarks = plan.lots.filter((l) => l.kind === 'landmark');
  const shops = plan.lots.filter((l) => l.kind === 'kit' && l.shop !== undefined);

  return (
    <group>
      <Ground />
      <Roads />
      <Sidewalks />

      {[...kitLots].map(([kit, lots]) => (
        <InstancedKit key={kit} kit={kit as KitRef} items={lots.map((l) => ({ position: [l.x, 0, l.z], rotationY: l.rotY, color: l.tint }))} />
      ))}
      {shops.map((l) => <DistanceCull key={l.id} x={l.x} z={l.z} radius={110}><ShopDressing lot={l} /></DistanceCull>)}
      {landmarks.map((l) => (
        // Towers stay on the skyline; low landmarks fade out with the haze.
        <DistanceCull key={l.id} x={l.x} z={l.z} radius={l.h > 30 ? 600 : 230}>
          <group position={[l.x, 0, l.z]} rotation={[0, l.rotY, 0]}>
            {LANDMARK[l.landmark!](l.props ?? {})}
          </group>
        </DistanceCull>
      ))}
      {[...props].map(([kit, items]) => (
        <InstancedKit key={kit} kit={kit as KitRef} shadows={!kit.includes('light')} items={items.map((p) => ({ position: [p.x, 0, p.z], rotationY: p.rotY, scale: p.scale }))} />
      ))}

      {physics && <CityColliders lots={plan.lots} walls={plan.walls} />}
    </group>
  );
}

/** Every building and landmark as a box collider, plus the perimeter walls, in one fixed body. */
function CityColliders({ lots, walls }: { lots: Lot[]; walls: { x: number; z: number; w: number; d: number }[] }) {
  // Market Boulevard's own pieces carry their colliders in district.tsx.
  const boxes = useMemo(() => lots.filter((l) => l.kind !== 'market').flatMap((l) => l.colliders ?? [{ ...lotRect(l), h: l.h }]), [lots]);
  return (
    <RigidBody type="fixed" colliders={false} friction={1}>
      {/* Ground slab under the whole city */}
      <CuboidCollider args={[(CITY_BOUNDS.maxX - CITY_BOUNDS.minX) / 2 + 20, 0.1, (CITY_BOUNDS.maxZ - CITY_BOUNDS.minZ) / 2 + 20]} position={[(CITY_BOUNDS.minX + CITY_BOUNDS.maxX) / 2, -0.1, (CITY_BOUNDS.minZ + CITY_BOUNDS.maxZ) / 2]} />
      {boxes.map((b, i) => <CuboidCollider key={i} args={[b.w / 2, b.h / 2, b.d / 2]} position={[b.x, b.h / 2, b.z]} />)}
      {walls.map((w, i) => <CuboidCollider key={`w${i}`} args={[w.w / 2, 4, w.d / 2]} position={[w.x, 4, w.z]} />)}
    </RigidBody>
  );
}
