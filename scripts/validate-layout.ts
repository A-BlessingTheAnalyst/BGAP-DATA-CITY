/**
 * Spatial integrity check for the Data City master plan (src/features/game/world/kit/cityPlan.ts).
 *
 *   npx tsx scripts/validate-layout.ts      (npm run validate:layout)
 *
 * Fails when:
 *   • two buildings overlap,
 *   • a building sits on a road or sidewalk,
 *   • anything is outside the city walls,
 *   • a story point (spawn, guard, café, every mission NPC and workstation) is inside a building
 *     or off the walkable area,
 *   • a traffic lane leaves the asphalt.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  cityPlan, lotRect, rectsOverlap, pointInRect, ROAD_RECTS, SIDEWALKS, CITY_BOUNDS, CITY_LANES, BLOCKS, districtAt, routeBetween, pathLength, type Rect,
} from '../src/features/game/world/kit/cityPlan';
import { MARKET_LAYOUT } from '../src/shared/constants/marketLayout';

const errors: string[] = [];
const warn: string[] = [];
const { lots, props, walls } = cityPlan();
const rects = lots.map((l) => ({ l, r: lotRect(l) }));
const fmt = (r: Rect) => `(${r.x.toFixed(1)}, ${r.z.toFixed(1)}) ${r.w.toFixed(1)}×${r.d.toFixed(1)}`;

// 1. Building ↔ building overlaps (5 cm tolerance).
for (let a = 0; a < rects.length; a++) for (let b = a + 1; b < rects.length; b++) {
  if (rectsOverlap(rects[a].r, rects[b].r, -0.05)) errors.push(`overlap: ${rects[a].l.id} ${fmt(rects[a].r)} ↔ ${rects[b].l.id} ${fmt(rects[b].r)}`);
}

// 2. Buildings on roads or sidewalks (the gate arch spans the boulevard on purpose).
for (const { l, r } of rects) {
  if (l.landmark === 'gate') continue;
  const shrink = { ...r, w: r.w - 0.1, d: r.d - 0.1 };
  if (ROAD_RECTS.some((x) => rectsOverlap(shrink, x))) errors.push(`on road: ${l.id} ${fmt(r)}`);
  else if (SIDEWALKS.some((x) => rectsOverlap(shrink, x))) errors.push(`on sidewalk: ${l.id} ${fmt(r)}`);
}

// 3. Bounds.
const inBounds = (x: number, z: number, pad = 0) => x > CITY_BOUNDS.minX + pad && x < CITY_BOUNDS.maxX - pad && z > CITY_BOUNDS.minZ + pad && z < CITY_BOUNDS.maxZ - pad;
for (const { l, r } of rects) if (!inBounds(r.x - r.w / 2, r.z - r.d / 2) || !inBounds(r.x + r.w / 2, r.z + r.d / 2)) errors.push(`out of bounds: ${l.id}`);
for (const p of props) if (!inBounds(p.x, p.z)) errors.push(`prop out of bounds: ${p.kit} at ${p.x.toFixed(1)},${p.z.toFixed(1)}`);
for (const p of props) {
  if (p.kit.startsWith('kenney-roads')) continue;
  const hit = rects.find(({ r }) => pointInRect(p.x, p.z, r, 0.5));
  if (hit) errors.push(`tree inside building: ${p.kit} at ${p.x.toFixed(1)},${p.z.toFixed(1)} in ${hit.l.id}`);
  if (ROAD_RECTS.some((x) => pointInRect(p.x, p.z, x, 0.6))) errors.push(`tree on road: ${p.kit} at ${p.x.toFixed(1)},${p.z.toFixed(1)}`);
}
if (walls.length !== 4) errors.push('expected 4 perimeter walls');

// 4. Story points must be reachable: not inside any building collider, inside the walls.
const points: { name: string; p: number[] }[] = [
  { name: 'spawn', p: MARKET_LAYOUT.spawn },
  { name: 'guard', p: MARKET_LAYOUT.guard },
  { name: 'café laptop', p: MARKET_LAYOUT.cafe.laptop },
  { name: 'café owner', p: MARKET_LAYOUT.cafe.owner },
  { name: 'tailor counter', p: MARKET_LAYOUT.tailor },
  { name: 'garage spot', p: MARKET_LAYOUT.garage },
];
const missionsDir = path.join(process.cwd(), 'content', 'missions');
for (const id of fs.readdirSync(missionsDir)) {
  const file = path.join(missionsDir, id, 'mission.json');
  if (!fs.existsSync(file)) continue;
  const m = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (m.location?.npc) points.push({ name: `${id} npc`, p: m.location.npc });
  if (m.location?.workstation) points.push({ name: `${id} workstation`, p: m.location.workstation });
  for (const e of m.evidence ?? []) points.push({ name: `${id} evidence ${e.id}`, p: e.position });
}
for (const { name, p } of points) {
  const [x, , z] = p;
  if (!inBounds(x, z, 1)) errors.push(`${name} is outside the city`);
  // The café is a hollow shell with a patio: its story points sit inside its footprint by design.
  const hit = rects.find(({ l, r }) => l.id !== 'market-cafe' && l.id !== 'market-stalls' && pointInRect(x, z, r, 0.35));
  if (hit) errors.push(`${name} at (${x}, ${z}) is inside ${hit.l.id}`);
  if (ROAD_RECTS.some((r) => pointInRect(x, z, r, -0.2))) warn.push(`${name} at (${x}, ${z}) stands on the road`);
}

// 5. Lanes stay on asphalt.
for (const [k, lane] of CITY_LANES.entries()) for (const [x, z] of lane.points) if (!ROAD_RECTS.some((r) => pointInRect(x, z, r))) errors.push(`lane ${k} point ${x},${z} is off-road`);

// 6. GPS: every story point can be routed from spawn.
for (const { name, p } of points) {
  const route = routeBetween([MARKET_LAYOUT.spawn[0], MARKET_LAYOUT.spawn[2]], [p[0], p[2]]);
  if (route.length < 2 || !Number.isFinite(pathLength(route))) errors.push(`no GPS route to ${name}`);
}

// Report.
const byDistrict = new Map<string, number>();
for (const l of lots) byDistrict.set(l.district, (byDistrict.get(l.district) ?? 0) + 1);
console.log(`City ${CITY_BOUNDS.maxX - CITY_BOUNDS.minX} × ${CITY_BOUNDS.maxZ - CITY_BOUNDS.minZ} m · ${BLOCKS.length} blocks · ${lots.length} buildings · ${props.length} props · ${CITY_LANES.reduce((n, l) => n + l.vehicles.length, 0)} vehicles`);
console.log('Buildings per district:', Object.fromEntries(byDistrict));
console.log(`Spawn district: ${districtAt(MARKET_LAYOUT.spawn[0], MARKET_LAYOUT.spawn[2])}`);
warn.forEach((w) => console.warn('warn:', w));
if (errors.length) {
  errors.slice(0, 60).forEach((e) => console.error('✗', e));
  console.error(`\n${errors.length} layout error(s).`);
  process.exit(1);
}
console.log(`✓ Layout valid (${points.length} story points checked).`);
