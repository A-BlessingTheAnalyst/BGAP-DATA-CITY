'use client';
import { ReactNode, useMemo } from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { KitModel, KitRef, kitSize, preloadKit } from './KitModel';
import { InstancedKit, Placement } from './InstancedKit';
import { ModularBuilding } from './modular';
import { HALF_ROAD, SIDEWALK, MARKET_FRONTAGE, MARKET_PIECES, marketFrontagePlacements } from './cityPlan';
import { PALETTE, seeded } from './palette';
import { Sign, WaterTank, ACUnit, Generator, Awning, V3 } from './parts';
import { SHOPS, CafeBisi, Kiosk, BusStop, MarketStalls } from './buildings';
import { Pedestrians, Traffic, Lane, Walkway } from './streetLife';

// Market Boulevard: the Chapter 1 district, assembled from CC0 library pieces
// (Kenney city, roads, cars, nature) plus Data City's own Lagos layer:
// shop signage, rooftop water tanks, generators, danfo, keke and the café.
//
// Used by the Asset Lab street scene (physics=false) and the game (physics=true).

/** Painted-plaster tints multiplied over library buildings: cream, mint, salmon, sky, butter, lilac. */
const PLASTER = ['#FFE3BA', '#DDF2DF', '#FFD6CC', '#DCEAF7', '#FFF0C9', '#EEDFFA', '#F7E6D4'];

const TILE = 10; // road tile size in metres (kenney-roads scale)

/** Wraps children in a fixed collider when the district runs inside a Rapier world. */
function Solid({ physics, size, position, rotationY = 0, offset = [0, 0, 0], children }: { physics: boolean; size: V3; position: V3; rotationY?: number; offset?: V3; children: ReactNode }) {
  if (!physics) return <group position={position} rotation={[0, rotationY, 0]}>{children}</group>;
  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={[0, rotationY, 0]}>
      <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} position={[offset[0], size[1] / 2 + offset[1], offset[2]]} />
      {children}
    </RigidBody>
  );
}

/** A library building dressed for Lagos: shop sign over the door, tanks and AC on the roof. */
export function LagosBuilding({ kit, shop, seed = 1, physics = false, position, rotationY = 0 }: {
  kit: KitRef; shop?: number; seed?: number; physics?: boolean; position: V3; rotationY?: number;
}) {
  const [w, h, d] = kitSize(kit);
  const rnd = useMemo(() => seeded(seed), [seed]);
  const s = shop !== undefined ? SHOPS[shop % SHOPS.length] : undefined;
  const tanks = Math.max(1, Math.round(w / 7));
  return (
    <Solid physics={physics} size={[w, h, d]} position={position} rotationY={rotationY}>
      {/* Kenney's flat palette takes a painted-plaster tint; Quaternius' PBR brick keeps its texture. */}
      <KitModel kit={kit} center tint={kit.startsWith('kenney') ? PLASTER[seed % PLASTER.length] : undefined} />
      {s && (
        <>
          <Sign text={s.text} sub={s.sub} w={Math.min(w * 0.8, 7)} h={1.1} position={[0, 3.6, d / 2 + 0.12]} bg={s.bg} fg={s.fg} lit />
          <Awning w={Math.min(w * 0.7, 6)} position={[0, 3.0, d / 2 + 0.1]} colors={[s.bg, '#F3F1EC']} depth={1.3} />
        </>
      )}
      {Array.from({ length: tanks }).map((_, i) => (
        <WaterTank key={i} position={[-w / 2 + (w / (tanks + 1)) * (i + 1), h, -d / 4 + rnd() * 0.5]} />
      ))}
      <ACUnit position={[w / 2 - 1, h * 0.45, d / 2 + 0.2]} />
      {rnd() > 0.5 && <ACUnit position={[-w / 2 + 1, h * 0.7, d / 2 + 0.2]} />}
    </Solid>
  );
}

/** The Market Boulevard frontage, positioned by the shared city plan (cityPlan.ts). */
function MarketFrontage({ physics }: { physics: boolean }) {
  const placed = useMemo(() => marketFrontagePlacements(), []);
  return (
    <>
      {placed.map((p) => {
        if (p.it.block) {
          return (
            <Solid key={`${p.row}-${p.k}`} physics={physics} size={[p.w, p.h, p.d]} position={[p.x, 0, p.z]} rotationY={p.rotY}>
              <ModularBuilding spec={p.it.block} />
            </Solid>
          );
        }
        return <LagosBuilding key={`${p.row}-${p.k}`} kit={p.it.kit!} shop={p.it.shop} seed={p.seed} physics={physics} position={[p.x, 0, p.z]} rotationY={p.rotY} />;
      })}
    </>
  );
}

function Road({ from, to, axis }: { from: number; to: number; axis: 'x' | 'z' }) {
  const tiles: number[] = [];
  for (let t = from; t <= to; t += TILE) if (Math.abs(t) > 1) tiles.push(t);
  return (
    <>
      {tiles.map((t) => (
        <KitModel key={t} kit="kenney-roads/road-straight" warm={false} shadows={false} position={axis === 'z' ? [0, 0, t] : [t, 0, 0]} rotation={axis === 'z' ? 0 : Math.PI / 2} />
      ))}
    </>
  );
}

function Sidewalks({ length, axis }: { length: number; axis: 'x' | 'z' }) {
  return (
    <>
      {[-1, 1].map((s) => (
        <mesh key={s} rotation={[-Math.PI / 2, 0, 0]} position={axis === 'z' ? [s * (HALF_ROAD + SIDEWALK / 2), 0.06, 0] : [0, 0.06, s * (HALF_ROAD + SIDEWALK / 2)]} receiveShadow>
          <planeGeometry args={axis === 'z' ? [SIDEWALK, length] : [length, SIDEWALK]} />
          <meshStandardMaterial color={PALETTE.ground.paving} roughness={0.95} />
        </mesh>
      ))}
    </>
  );
}

const WEST = MARKET_FRONTAGE.filter((r) => r.side < 0).flatMap((r) => r.items);

const STREET_Z = [-55, -45, -35, -25, -15, 15, 25, 35, 45, 55];
const LAMPS: Placement[] = STREET_Z.flatMap((z, i) => [
  { position: [(i % 2 ? 1 : -1) * (HALF_ROAD + 0.4), 0, z], rotationY: i % 2 ? Math.PI : 0 },
  { position: [z, 0, (i % 2 ? 1 : -1) * (HALF_ROAD + 0.4)], rotationY: i % 2 ? Math.PI / 2 : -Math.PI / 2 },
]);
const PALMS: Placement[] = STREET_Z.flatMap((z, i) => [
  { position: [(i % 2 ? -1 : 1) * (HALF_ROAD + SIDEWALK - 0.8), 0, z + 4], rotationY: i, scale: 0.9 + (i % 3) * 0.12 },
  { position: [z + 4, 0, (i % 2 ? -1 : 1) * (HALF_ROAD + SIDEWALK - 0.8)], rotationY: i * 2, scale: 0.85 + (i % 4) * 0.1 },
]);
const BUSHES: Placement[] = [-48, -24, 24, 48].flatMap((x, i) => [
  { position: [x, 0, HALF_ROAD + SIDEWALK - 0.8], rotationY: i },
  { position: [x + 6, 0, -(HALF_ROAD + SIDEWALK - 0.8)], rotationY: -i },
]);

// Two-lane loops: drive on the right, U-turn at each end of the district.
const LANES: Lane[] = [
  { points: [[2.5, -62], [2.5, 62], [-2.5, 62], [-2.5, -62]], vehicles: ['danfo', 'taxi', 'sedan', 'keke', 'suv', 'okada'], speed: 7 },
  { points: [[-62, -2.5], [62, -2.5], [62, 2.5], [-62, 2.5]], vehicles: ['keke', 'taxi', 'danfo'], speed: 6 },
];
const WALKWAYS: Walkway[] = [
  { x: -(HALF_ROAD + SIDEWALK / 2), z: 0, w: SIDEWALK, d: 120 },
  { x: HALF_ROAD + SIDEWALK / 2, z: 0, w: SIDEWALK, d: 120 },
  { x: 0, z: -(HALF_ROAD + SIDEWALK / 2), w: 120, d: SIDEWALK },
  { x: 0, z: HALF_ROAD + SIDEWALK / 2, w: 120, d: SIDEWALK },
];

preloadKit(['kenney-roads/road-straight', 'kenney-roads/road-crossroad', 'kenney-roads/light-square', 'kenney-nature/tree_palmTall', ...WEST.flatMap((w) => (w.kit ? [w.kit] : []))]);

/** `streets`: draw the boulevard's own roads (Asset Lab); the game draws the city-wide grid instead. */
export function MarketBoulevard({ physics = false, life = true, streets = true }: { physics?: boolean; life?: boolean; streets?: boolean }) {
  const length = 120;
  return (
    <group>
      {/* Roads: north–south boulevard with a crossroad at the café junction */}
      {streets && (
        <>
          <Road from={-60} to={60} axis="z" />
          <Road from={-60} to={60} axis="x" />
          <KitModel kit="kenney-roads/road-crossroad" warm={false} shadows={false} position={[0, 0, 0]} />
          <Sidewalks length={length} axis="z" />
          <Sidewalks length={length} axis="x" />
        </>
      )}

      {/* Frontage on both sides of the boulevard, broken by Oja Street */}
      <MarketFrontage physics={physics} />

      {/* Mama Bisi's café on the north-east corner, facing the boulevard */}
      <Solid physics={physics} size={MARKET_PIECES.cafe.size} offset={MARKET_PIECES.cafe.offset} position={MARKET_PIECES.cafe.position} rotationY={MARKET_PIECES.cafe.rotY}>
        <CafeBisi />
      </Solid>
      {/* Market and kiosk on the cross street */}
      <group position={[-30, 0, 14]}><MarketStalls /></group>
      <Solid physics={physics} size={[2.6, 3, 2.4]} position={MARKET_PIECES.kiosk.position} rotationY={Math.PI}><Kiosk /></Solid>
      <group position={[HALF_ROAD + 2, 0, 22]} rotation={[0, -Math.PI / 2, 0]}><BusStop name="MARKET STOP" /></group>
      <Solid physics={physics} size={[1.6, 1.6, 0.9]} position={MARKET_PIECES.generator.position} rotationY={Math.PI / 2}><Generator position={[0, 0, 0]} /></Solid>

      {/* Street furniture: instanced so dozens of palms and lamps cost a few draw calls */}
      <InstancedKit kit="kenney-roads/light-square" items={LAMPS} />
      <InstancedKit kit="kenney-nature/tree_palmTall" items={PALMS} />
      <InstancedKit kit="kenney-nature/plant_bushLarge" items={BUSHES} />
      <KitModel kit="kenney-roads/traffic-light" position={[HALF_ROAD + 0.6, 0, HALF_ROAD + 0.6]} rotation={Math.PI} />
      <KitModel kit="kenney-roads/traffic-light" position={[-HALF_ROAD - 0.6, 0, -HALF_ROAD - 0.6]} />
      {[-40, 20, 44].map((z) => <KitModel key={z} kit="kenney-roads/electricity-pole" position={[-HALF_ROAD - SIDEWALK + 0.3, 0, z]} rotation={Math.PI / 2} />)}

      {/* Parked library vehicles */}
      <Solid physics={physics} size={[2.2, 2.4, 5]} position={[-14, 0, 7.6]} rotationY={Math.PI / 2}><KitModel kit="kenney-cars/van" /></Solid>
      <Solid physics={physics} size={[2.2, 2.8, 5.4]} position={[-HALF_ROAD - 0.6, 0, -46]}><KitModel kit="kenney-cars/delivery" /></Solid>

      {/* Moving traffic (yuka lanes) and pedestrians (recast navmesh crowd) */}
      {life && <Traffic lanes={LANES} />}
      {life && <Pedestrians walkways={WALKWAYS} count={16} />}
    </group>
  );
}
