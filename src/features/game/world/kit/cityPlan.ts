// The Data City master plan: one pure, deterministic description of the whole city.
// No React and no three.js here, so the same plan drives:
//   • the 3D world (roads, sidewalks, instanced buildings, landmarks, colliders),
//   • traffic lanes and the pedestrian navmesh,
//   • the minimap, full map and GPS routing,
//   • scripts/validate-layout.ts (overlaps, blocked story points, out-of-bounds).
//
// Units are metres; +X is east, +Z is north on the map. Buildings face +Z at rotY = 0.

import { kitSize, modularSize, type KitRef, type ModularSpec } from './kitData';

// ─────────────────────────────── Grid and roads ───────────────────────────────

export const TILE = 10;
export const HALF_ROAD = TILE / 2;
export const SIDEWALK = 4;
/** Road centre → back of sidewalk. */
export const KERB = HALF_ROAD + SIDEWALK;
/** Road centre-lines of the street grid, on both axes. */
export const GRID = [-240, -120, 0, 120, 240];
/** Walkable extent (perimeter walls sit on these lines). */
export const CITY_BOUNDS = { minX: -262, maxX: 262, minZ: -300, maxZ: 262 };

export type DistrictId = 'academy' | 'market' | 'finance' | 'tech' | 'gardens' | 'gateway';

export const DISTRICT_INFO: Record<DistrictId, { name: string; ground: string; map: string }> = {
  market: { name: 'Market Boulevard', ground: '#CDB896', map: '#E7C98F' },
  finance: { name: 'Finance Row', ground: '#D6CFC2', map: '#AFC3DE' },
  tech: { name: 'Tech Park', ground: '#BDB7AB', map: '#9ED8DB' },
  gardens: { name: 'Ilé Gardens', ground: '#A9B979', map: '#B7D59B' },
  academy: { name: 'Academy Quarter', ground: '#BFC98E', map: '#D8E3A6' },
  gateway: { name: 'City Gateway', ground: '#C9B28C', map: '#E4B79A' },
};

/** A straight road. `axis: 'z'` runs north–south at x = `at`; `axis: 'x'` runs east–west at z = `at`. */
export interface RoadDef { id: string; name: string; axis: 'x' | 'z'; at: number; from: number; to: number; main?: boolean }

export const ROADS: RoadDef[] = [
  { id: 'lagoon', name: 'Lagoon Road', axis: 'z', at: -240, from: -240, to: 240 },
  { id: 'ile', name: 'Ilé Avenue', axis: 'z', at: -120, from: -240, to: 240 },
  { id: 'boulevard', name: 'Market Boulevard', axis: 'z', at: 0, from: -290, to: 240, main: true },
  { id: 'datacore', name: 'Datacore Avenue', axis: 'z', at: 120, from: -240, to: 240 },
  { id: 'eastgate', name: 'Eastgate Road', axis: 'z', at: 240, from: -240, to: 240 },
  { id: 'academy', name: 'Academy Ring', axis: 'x', at: -240, from: -240, to: 240 },
  { id: 'unity', name: 'Unity Road', axis: 'x', at: -120, from: -240, to: 240 },
  { id: 'oja', name: 'Oja Street', axis: 'x', at: 0, from: -240, to: 240, main: true },
  { id: 'meridian', name: 'Meridian Way', axis: 'x', at: 120, from: -240, to: 240 },
  { id: 'northline', name: 'Northline Road', axis: 'x', at: 240, from: -240, to: 240 },
];

const onRoad = (r: RoadDef, along: number) => along >= r.from - 0.01 && along <= r.to + 0.01;

export interface Intersection { x: number; z: number; arms: number; roads: [string, string] }

/** Every point where a north–south road meets an east–west one, with how many arms leave it. */
export const INTERSECTIONS: Intersection[] = (() => {
  const out: Intersection[] = [];
  for (const a of ROADS.filter((r) => r.axis === 'z')) for (const b of ROADS.filter((r) => r.axis === 'x')) {
    if (!onRoad(a, b.at) || !onRoad(b, a.at)) continue;
    const arms = Number(b.at > a.from) + Number(b.at < a.to) + Number(a.at > b.from) + Number(a.at < b.to);
    out.push({ x: a.at, z: b.at, arms, roads: [a.id, b.id] });
  }
  return out;
})();

/** Coordinates along a road where it crosses another road. */
function crossings(r: RoadDef): number[] {
  return INTERSECTIONS.filter((i) => i.roads.includes(r.id)).map((i) => (r.axis === 'z' ? i.z : i.x)).sort((a, b) => a - b);
}

export interface Tile { x: number; z: number; rotY: number; kind: 'straight' | 'crossroad' | 'square' }

/** 10 m road tiles: straights between junctions, crossroads at 4-way junctions, plain squares at T-junctions and corners. */
export const ROAD_TILES: Tile[] = (() => {
  const tiles: Tile[] = [];
  const key = new Set<string>();
  for (const i of INTERSECTIONS) {
    tiles.push({ x: i.x, z: i.z, rotY: 0, kind: i.arms === 4 ? 'crossroad' : 'square' });
    key.add(`${i.x},${i.z}`);
  }
  for (const r of ROADS) {
    for (let t = r.from; t <= r.to; t += TILE) {
      const [x, z] = r.axis === 'z' ? [r.at, t] : [t, r.at];
      if (key.has(`${x},${z}`)) continue;
      tiles.push({ x, z, rotY: r.axis === 'z' ? 0 : Math.PI / 2, kind: 'straight' });
    }
  }
  return tiles;
})();

/** Axis-aligned rectangle (centre + full size). */
export interface Rect { x: number; z: number; w: number; d: number }

export const rectsOverlap = (a: Rect, b: Rect, pad = 0) =>
  Math.abs(a.x - b.x) * 2 < a.w + b.w + pad * 2 && Math.abs(a.z - b.z) * 2 < a.d + b.d + pad * 2;
export const pointInRect = (x: number, z: number, r: Rect, pad = 0) =>
  Math.abs(x - r.x) <= r.w / 2 + pad && Math.abs(z - r.z) <= r.d / 2 + pad;

/** Asphalt corridors (one rect per road, ends included). */
export const ROAD_RECTS: Rect[] = ROADS.map((r) => {
  const mid = (r.from + r.to) / 2, len = r.to - r.from + TILE;
  return r.axis === 'z' ? { x: r.at, z: mid, w: TILE, d: len } : { x: mid, z: r.at, w: len, d: TILE };
});

/** Sidewalk strips between junctions, plus the corner squares that join them. */
export const SIDEWALKS: Rect[] = (() => {
  const out: Rect[] = [];
  const off = HALF_ROAD + SIDEWALK / 2;
  for (const r of ROADS) {
    // Pairs (start, end) between junction mouths.
    const spans: [number, number][] = [];
    const cs = crossings(r);
    let start = cs[0] === r.from ? r.from + HALF_ROAD : r.from - HALF_ROAD;
    for (const c of cs) {
      if (c === r.from) continue;
      spans.push([start, c - HALF_ROAD]);
      start = c + HALF_ROAD;
    }
    if (cs[cs.length - 1] !== r.to) spans.push([start, r.to + HALF_ROAD]);
    for (const [a, b] of spans) {
      if (b - a < 0.5) continue;
      for (const s of [-1, 1]) {
        out.push(r.axis === 'z' ? { x: r.at + s * off, z: (a + b) / 2, w: SIDEWALK, d: b - a } : { x: (a + b) / 2, z: r.at + s * off, w: b - a, d: SIDEWALK });
      }
    }
  }
  for (const i of INTERSECTIONS) for (const sx of [-1, 1]) for (const sz of [-1, 1]) out.push({ x: i.x + sx * off, z: i.z + sz * off, w: SIDEWALK, d: SIDEWALK });
  return out;
})();

/** Zebra crossings across each arm of the inner junctions (pedestrian navmesh links). */
export const CROSSINGS: Rect[] = INTERSECTIONS.filter((i) => i.arms === 4).flatMap((i) => {
  const off = HALF_ROAD + SIDEWALK / 2;
  return [
    { x: i.x, z: i.z + off, w: TILE, d: 3 },
    { x: i.x, z: i.z - off, w: TILE, d: 3 },
    { x: i.x + off, z: i.z, w: 3, d: TILE },
    { x: i.x - off, z: i.z, w: 3, d: TILE },
  ];
});

// ─────────────────────────────── Blocks and districts ───────────────────────────────

export interface Block extends Rect { i: number; j: number; district: DistrictId; park?: boolean }

const DISTRICT_GRID: DistrictId[][] = [
  // j = 0 (south, z −240…−120) → j = 3 (north, z 120…240); i = 0 (west) → 3 (east)
  ['gardens', 'academy', 'academy', 'gateway'],
  ['gardens', 'market', 'market', 'tech'],
  ['gardens', 'market', 'market', 'tech'],
  ['gardens', 'finance', 'finance', 'tech'],
];
const PARKS = new Set(['0,3', '1,0']);

export const BLOCKS: Block[] = (() => {
  const out: Block[] = [];
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
    const x0 = GRID[i] + KERB, x1 = GRID[i + 1] - KERB, z0 = GRID[j] + KERB, z1 = GRID[j + 1] - KERB;
    out.push({ i, j, x: (x0 + x1) / 2, z: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0, district: DISTRICT_GRID[j][i], park: PARKS.has(`${i},${j}`) });
  }
  return out;
})();

export function districtAt(x: number, z: number): DistrictId {
  if (z < GRID[0] - KERB) return 'gateway';
  const cx = Math.max(GRID[0] + 1, Math.min(GRID[4] - 1, x)), cz = Math.max(GRID[0] + 1, Math.min(GRID[4] - 1, z));
  const i = GRID.findIndex((g, k) => k < 4 && cx >= g && cx < GRID[k + 1]);
  const j = GRID.findIndex((g, k) => k < 4 && cz >= g && cz < GRID[k + 1]);
  return DISTRICT_GRID[Math.max(0, j)][Math.max(0, i)];
}

/** The road the point is on or beside (within the sidewalk), if any. */
export function streetAt(x: number, z: number): RoadDef | null {
  let best: RoadDef | null = null, bestD = KERB + 1.5;
  for (const r of ROADS) {
    const [across, along] = r.axis === 'z' ? [x - r.at, z] : [z - r.at, x];
    if (along < r.from - KERB || along > r.to + KERB) continue;
    const d = Math.abs(across);
    if (d < bestD) { bestD = d; best = r; }
  }
  return best;
}

// ─────────────────────────────── Lots ───────────────────────────────

export type LandmarkId =
  | 'academy' | 'spire' | 'primary' | 'clinic' | 'clock' | 'apartments' | 'bank'
  | 'tower_meridian' | 'tower_vantage' | 'tower_okeke' | 'tower_lumen' | 'tower_kora'
  | 'techhub' | 'petrol' | 'gate';

export interface Lot {
  id: string;
  /** `kit`: instanced library building; `landmark`: procedural Data City building; `market`: hand-built Market Boulevard piece. */
  kind: 'kit' | 'landmark' | 'market';
  kit?: KitRef;
  landmark?: LandmarkId;
  /** Extra props for the landmark component (company, name…). */
  props?: Record<string, string | number>;
  x: number; z: number; rotY: number;
  /** Footprint in the building's own frame and its height. */
  w: number; d: number; h: number;
  district: DistrictId;
  tint?: string;
  shop?: number;
  /** Faces a public road (gets signage); false for back-of-block infill. */
  front?: boolean;
  /** Collision boxes (world space). Defaults to the footprint. */
  colliders?: (Rect & { h: number })[];
}

/** World-axis footprint of a lot. */
export function lotRect(l: Lot): Rect {
  const quarter = Math.abs(Math.round(l.rotY / (Math.PI / 2))) % 2 === 1;
  return { x: l.x, z: l.z, w: quarter ? l.d : l.w, d: quarter ? l.w : l.d };
}

// Market Boulevard frontage (the original Chapter 1 street, rendered by district.tsx).
export interface FrontItem { kit?: KitRef; shop?: number; block?: ModularSpec }
export const MARKET_BANK: ModularSpec = { bays: 8, depth: 6, floors: 4, window: 'Brick_Window_Trim', shopfront: 'Metal_FirstFloor_Window', cornice: 'Cornice_Trim_Center', sign: { text: 'MERIDIAN CAPITAL', sub: 'Bank • ATM inside', bg: '#1F3A6B', fg: '#D4A017' } };

export const MARKET_FRONTAGE: { items: FrontItem[]; side: 1 | -1; start: number }[] = [
  { side: -1, start: -59, items: [
    { kit: 'kenney-commercial/building-e', shop: 0 },
    { kit: 'kenney-commercial/building-a', shop: 1 },
    { kit: 'kenney-commercial/building-h', shop: 3 },
    { kit: 'kenney-commercial/building-k', shop: 4 },
  ] },
  { side: -1, start: 11, items: [
    { kit: 'kenney-commercial/building-c', shop: 5 },
    { kit: 'kenney-commercial/building-i', shop: 6 },
    { kit: 'kenney-commercial/building-d', shop: 7 },
    { kit: 'quaternius-downtown/Building_Large_2' },
  ] },
  { side: 1, start: -58, items: [
    { kit: 'quaternius-downtown/Building_Medium_2_001' },
    { kit: 'kenney-commercial/building-f', shop: 1 },
    { kit: 'quaternius-downtown/Building_Small_1' },
  ] },
  { side: 1, start: 12, items: [
    { kit: 'kenney-commercial/building-b', shop: 2 },
    { kit: 'kenney-commercial/building-g' },
    { block: MARKET_BANK },
  ] },
];
const FRONT_GAP = 1.2;

export const frontItemSize = (it: FrontItem) => (it.block ? modularSize(it.block) : kitSize(it.kit!));

/** Positions of the Market Boulevard frontage buildings, shoulder to shoulder along the boulevard. */
export function marketFrontagePlacements() {
  return MARKET_FRONTAGE.flatMap(({ items, side, start }, row) => {
    let cursor = start;
    return items.map((it, k) => {
      const [w, h, d] = frontItemSize(it);
      const z = cursor + w / 2;
      cursor += w + FRONT_GAP;
      const x = side * (KERB + d / 2 + 0.5);
      return { it, row, k, side, x, z, rotY: (-side * Math.PI) / 2, w, h, d, seed: k * 13 + (side > 0 ? 7 : 0) };
    });
  });
}

/** Café, market and kiosk positions (also used by district.tsx). */
export const MARKET_PIECES = {
  cafe: { position: [KERB + 7.5, 0, 56] as [number, number, number], rotY: -Math.PI / 2, size: [14, 4.5, 9] as [number, number, number], offset: [0, 0, -2.5] as [number, number, number] },
  stalls: { position: [-30, 0, 14] as [number, number, number] },
  kiosk: { position: [18, 0, -HALF_ROAD - 2.6] as [number, number, number] },
  busStop: { position: [HALF_ROAD + 2, 0, 22] as [number, number, number] },
  generator: { position: [-HALF_ROAD - 3, 0, -20] as [number, number, number] },
};

function marketLots(): Lot[] {
  const lots: Lot[] = marketFrontagePlacements().map((p) => ({
    id: `market-${p.row}-${p.k}`, kind: 'market' as const, kit: p.it.kit, x: p.x, z: p.z, rotY: p.rotY, w: p.w, d: p.d, h: p.h, district: 'market' as const, front: true,
  }));
  const c = MARKET_PIECES.cafe;
  // The café's collider is offset 2.5 m back from its origin; rotated −90° that is +2.5 m in x.
  lots.push({ id: 'market-cafe', kind: 'market', x: c.position[0] - c.offset[2], z: c.position[2], rotY: c.rotY, w: c.size[0], d: c.size[2], h: c.size[1], district: 'market', front: true });
  lots.push({ id: 'market-stalls', kind: 'market', x: -30, z: 14, rotY: 0, w: 15, d: 9, h: 3, district: 'market', colliders: [] });
  return lots;
}

// Hand-placed Data City landmarks. Positions put each front on a road (lot centre = road + KERB + 0.5 + depth/2).
const LANDMARKS: Omit<Lot, 'kind' | 'id'>[] = [
  { landmark: 'academy', x: -60, z: -142.5, rotY: 0, w: 44, d: 26, h: 12.5, district: 'academy' },
  { landmark: 'spire', x: -60, z: -186, rotY: 0, w: 14, d: 14, h: 18, district: 'academy', colliders: [{ x: -60, z: -186, w: 5, d: 5, h: 18 }] },
  { landmark: 'primary', x: -140.5, z: -60, rotY: Math.PI / 2, w: 30, d: 22, h: 5.2, district: 'gardens' },
  { landmark: 'clinic', x: -136.5, z: 60, rotY: Math.PI / 2, w: 18, d: 14, h: 7, district: 'gardens' },
  { landmark: 'clock', x: -180, z: 180, rotY: 0, w: 18, d: 18, h: 15.5, district: 'gardens', colliders: [{ x: -180, z: 180, w: 5, d: 5, h: 15.5 }] },
  { landmark: 'apartments', x: -195, z: 17, rotY: Math.PI, w: 22, d: 15, h: 14, district: 'gardens', props: { name: 'ILÉ GARDENS' } },
  { landmark: 'apartments', x: -180, z: -137, rotY: 0, w: 22, d: 15, h: 14, district: 'gardens', props: { name: 'LAGOON FLATS' } },
  { landmark: 'bank', x: -18.5, z: 160, rotY: Math.PI / 2, w: 26, d: 18, h: 9.8, district: 'finance' },
  { landmark: 'tower_meridian', x: 22.5, z: 170, rotY: -Math.PI / 2, w: 26, d: 26, h: 80, district: 'finance', props: { company: 'meridianHQ' } },
  { landmark: 'tower_vantage', x: -70, z: 142.5, rotY: Math.PI, w: 26, d: 26, h: 44, district: 'finance', props: { company: 'vantage' } },
  { landmark: 'tower_okeke', x: 70, z: -60, rotY: 0, w: 26, d: 26, h: 26, district: 'market', props: { company: 'okeke' }, front: false },
  { landmark: 'techhub', x: 140.5, z: -60, rotY: -Math.PI / 2, w: 30, d: 22, h: 8.5, district: 'tech' },
  { landmark: 'tower_lumen', x: 142.5, z: 60, rotY: -Math.PI / 2, w: 26, d: 26, h: 58, district: 'tech', props: { company: 'lumen' } },
  { landmark: 'tower_kora', x: 180, z: 142.5, rotY: Math.PI, w: 26, d: 26, h: 36, district: 'tech', props: { company: 'kora' } },
  { landmark: 'petrol', x: 180, z: -139.5, rotY: 0, w: 26, d: 20, h: 7, district: 'gateway' },
  // The gate arch spans the boulevard; only its two pillars collide.
  { landmark: 'gate', x: 0, z: -268, rotY: 0, w: 21, d: 3, h: 10.6, district: 'gateway', colliders: [{ x: -9.6, z: -268, w: 1.8, d: 1.8, h: 10.6 }, { x: 9.6, z: -268, w: 1.8, d: 1.8, h: 10.6 }] },
];

// Library building pools per district (frontage and back-of-block infill).
const C = (n: string) => `kenney-commercial/${n}` as KitRef;
const S = (n: string) => `kenney-suburban/building-type-${n}` as KitRef;
const POOLS: Record<DistrictId, { front: KitRef[]; infill: KitRef[]; tint: boolean; signs: boolean }> = {
  market: { front: 'abcdefghik'.split('').map((c) => C(`building-${c}`)), infill: [...'abcdefghk'.split('').map((c) => C(`building-${c}`)), C('low-detail-building-wide-a'), C('low-detail-building-wide-b')], tint: true, signs: true },
  finance: { front: ['building-skyscraper-a', 'building-skyscraper-b', 'building-skyscraper-c', 'building-skyscraper-d', 'building-skyscraper-e', 'building-l', 'building-m', 'building-n'].map(C), infill: ['building-skyscraper-a', 'building-skyscraper-c', 'building-skyscraper-e', 'building-l', 'building-n', 'low-detail-building-wide-a'].map(C), tint: false, signs: false },
  tech: { front: ['building-j', 'building-l', 'building-n', 'building-skyscraper-a', 'building-skyscraper-c', 'building-e'].map(C), infill: ['low-detail-building-wide-a', 'low-detail-building-wide-b', 'building-k', 'building-e'].map(C), tint: false, signs: false },
  gardens: { front: 'abcdefghijklmnopqrstu'.split('').map(S), infill: 'acehijmpq'.split('').map(S), tint: true, signs: false },
  academy: { front: [...'acdeo'.split('').map(S), C('building-c'), C('building-e'), C('building-k')], infill: 'ghipq'.split('').map(S), tint: true, signs: false },
  gateway: { front: ['building-e', 'building-k', 'building-j', 'building-c'].map(C), infill: ['low-detail-building-wide-a', 'low-detail-building-wide-b', 'low-detail-building-n'].map(C), tint: true, signs: false },
};

/** Painted-plaster tints for library buildings: cream, mint, salmon, sky, butter, lilac. */
export const PLASTER = ['#FFE3BA', '#DDF2DF', '#FFD6CC', '#DCEAF7', '#FFF0C9', '#EEDFFA', '#F7E6D4'];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Prop { kit: KitRef; x: number; z: number; rotY: number; scale: number }

export interface CityPlan {
  lots: Lot[];
  /** Street trees, park trees, lamps (instanced, no colliders). */
  props: Prop[];
  /** Perimeter walls (world rects). */
  walls: Rect[];
}

/** Story points that must stay walkable (spawn, NPCs, workstations). Filled in by callers. */
export interface KeepClear { x: number; z: number; r: number }

const MARKET_CORE = 66; // |x|,|z| below this on the central roads is hand-dressed by district.tsx

let cached: CityPlan | null = null;

/** Builds (once) the full deterministic plan. */
export function cityPlan(): CityPlan {
  if (cached) return cached;
  const lots: Lot[] = [...marketLots()];
  LANDMARKS.forEach((l, k) => lots.push({ ...l, id: `landmark-${l.landmark}-${k}`, kind: 'landmark', front: l.front ?? true }));
  const occupied: Rect[] = lots.map(lotRect);
  // Keep the café patio, the market lane and the Zee Fabrics / kiosk tables clear.
  occupied.push({ x: 12, z: 56, w: 6, d: 16 }, { x: -30, z: 22, w: 20, d: 8 });
  const fits = (r: Rect, pad: number) => !occupied.some((o) => rectsOverlap(r, o, pad));
  const props: Prop[] = [];

  for (const b of BLOCKS) {
    const pool = POOLS[b.district];
    const rnd = rng(b.i * 7 + b.j * 31 + 11);
    const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
    const x0 = b.x - b.w / 2, x1 = b.x + b.w / 2, z0 = b.z - b.d / 2, z1 = b.z + b.d / 2;

    if (b.park) {
      // A shaded park: lawn, a ring of palms and scattered shade trees.
      for (let k = 0; k < 46; k++) {
        const x = x0 + 6 + rnd() * (b.w - 12), z = z0 + 6 + rnd() * (b.d - 12);
        const r: Rect = { x, z, w: 3, d: 3 };
        if (!fits(r, 1)) continue;
        props.push({ kit: pick(['kenney-nature/tree_default', 'kenney-nature/tree_oak', 'kenney-nature/tree_palmTall', 'kenney-nature/tree_fat'] as KitRef[]), x, z, rotY: rnd() * 6.28, scale: 0.9 + rnd() * 0.5 });
      }
      continue;
    }

    // Frontage: walk each of the block's four road sides, laying buildings shoulder to shoulder.
    const sides: { axis: 'x' | 'z'; road: number; side: 1 | -1; a: number; b: number }[] = [
      { axis: 'z', road: x0 - KERB, side: 1, a: z0, b: z1 }, // west road, lots east of it
      { axis: 'z', road: x1 + KERB, side: -1, a: z0, b: z1 }, // east road
      { axis: 'x', road: z0 - KERB, side: 1, a: x0, b: x1 }, // south road, lots north of it
      { axis: 'x', road: z1 + KERB, side: -1, a: x0, b: x1 }, // north road
    ];
    let n = 0;
    for (const s of sides) {
      let cursor = s.a + 0.6;
      let guard = 0;
      while (cursor < s.b - 5 && guard++ < 80) {
        const kit = pick(pool.front);
        const [w, h, d] = kitSize(kit);
        if (cursor + w > s.b - 0.6) { cursor += 2; continue; }
        const along = cursor + w / 2;
        const across = s.road + s.side * (KERB + 0.5 + d / 2);
        const rotY = s.axis === 'z' ? (-s.side * Math.PI) / 2 : s.side > 0 ? Math.PI : 0;
        const [x, z] = s.axis === 'z' ? [across, along] : [along, across];
        const lot: Lot = { id: `b${b.i}${b.j}-f${n++}`, kind: 'kit', kit, x, z, rotY, w, d, h, district: b.district, front: true, tint: pool.tint ? PLASTER[Math.floor(rnd() * PLASTER.length)] : undefined };
        // The hand-built boulevard frontage is already in `occupied`; only its own street faces stay hand-dressed.
        const inCore = b.district === 'market' && Math.abs(x) < 30 && Math.abs(z) < MARKET_CORE;
        const r = lotRect(lot);
        if (!inCore && fits(r, 0.4)) {
          if (pool.signs && rnd() < 0.55) lot.shop = Math.floor(rnd() * 100);
          lots.push(lot);
          occupied.push(r);
          cursor += w + 1 + rnd() * 1.5;
        } else cursor += 2;
      }
    }

    // Back-of-block infill on a jittered grid; leftover spots become trees.
    for (let gx = x0 + 10; gx < x1 - 6; gx += 13) for (let gz = z0 + 10; gz < z1 - 6; gz += 13) {
      const x = gx + (rnd() - 0.5) * 3, z = gz + (rnd() - 0.5) * 3;
      const kit = pick(pool.infill);
      const [w, h, d] = kitSize(kit);
      const rotY = rnd() < 0.5 ? 0 : Math.PI;
      const lot: Lot = { id: `b${b.i}${b.j}-i${n++}`, kind: 'kit', kit, x, z, rotY, w, d, h, district: b.district, front: false, tint: pool.tint ? PLASTER[Math.floor(rnd() * PLASTER.length)] : undefined };
      const r = lotRect(lot);
      const inside = r.x - r.w / 2 > x0 + 1 && r.x + r.w / 2 < x1 - 1 && r.z - r.d / 2 > z0 + 1 && r.z + r.d / 2 < z1 - 1;
      if (inside && fits(r, 2.5)) {
        lots.push(lot);
        occupied.push(r);
      } else if (fits({ x, z, w: 3, d: 3 }, 1.5) && rnd() < 0.6) {
        const tree = b.district === 'gardens' || b.district === 'academy' ? 'kenney-nature/tree_default' : 'kenney-nature/tree_palmTall';
        props.push({ kit: tree as KitRef, x, z, rotY: rnd() * 6.28, scale: 0.9 + rnd() * 0.4 });
        occupied.push({ x, z, w: 2, d: 2 });
      }
    }
  }

  // Street trees and lamps along every sidewalk outside the hand-dressed market core.
  const rnd = rng(99);
  for (const r of ROADS) {
    for (let t = r.from + 15; t < r.to - 5; t += 30) {
      if (GRID.some((g) => Math.abs(g - t) < 12)) continue;
      for (const s of [-1, 1] as const) {
        const [lx, lz] = r.axis === 'z' ? [r.at + s * (HALF_ROAD + 0.4), t] : [t, r.at + s * (HALF_ROAD + 0.4)];
        const [tx, tz] = r.axis === 'z' ? [r.at + s * (KERB - 0.8), t + 12] : [t + 12, r.at + s * (KERB - 0.8)];
        const core = (x: number, z: number) => Math.abs(x) < MARKET_CORE && Math.abs(z) < MARKET_CORE;
        if (!core(lx, lz)) props.push({ kit: 'kenney-roads/light-square', x: lx, z: lz, rotY: r.axis === 'z' ? (s > 0 ? Math.PI : 0) : s > 0 ? -Math.PI / 2 : Math.PI / 2, scale: 1 });
        if (!core(tx, tz) && !GRID.some((g) => Math.abs(g - (t + 12)) < KERB + 3)) {
          const d = districtAt(tx, tz);
          const kit = (d === 'gardens' || d === 'academy' ? 'kenney-nature/tree_default' : 'kenney-nature/tree_palmTall') as KitRef;
          props.push({ kit, x: tx, z: tz, rotY: rnd() * 6.28, scale: 0.85 + rnd() * 0.3 });
        }
      }
    }
  }
  // Perimeter tree belt outside the ring road.
  for (let t = -250; t <= 250; t += 9) {
    for (const [x, z] of [[t, CITY_BOUNDS.maxZ - 5], [CITY_BOUNDS.minX + 5, t], [CITY_BOUNDS.maxX - 5, t], [t, -253]] as [number, number][]) {
      if (Math.abs(x) < 14 && z < 0) continue; // the boulevard leaves the city here
      props.push({ kit: rnd() < 0.5 ? 'kenney-nature/tree_palmTall' : 'kenney-nature/tree_fat', x: x + (rnd() - 0.5) * 3, z: z + (rnd() - 0.5) * 3, rotY: rnd() * 6.28, scale: 1 + rnd() * 0.4 });
    }
  }

  const B = CITY_BOUNDS;
  const walls: Rect[] = [
    { x: 0, z: B.maxZ, w: B.maxX - B.minX, d: 1 },
    { x: 0, z: B.minZ, w: B.maxX - B.minX, d: 1 },
    { x: B.minX, z: (B.minZ + B.maxZ) / 2, w: 1, d: B.maxZ - B.minZ },
    { x: B.maxX, z: (B.minZ + B.maxZ) / 2, w: 1, d: B.maxZ - B.minZ },
  ];

  cached = { lots, props, walls };
  return cached;
}

// ─────────────────────────────── Traffic and pedestrians ───────────────────────────────

export type VehicleKind = 'taxi' | 'sedan' | 'suv' | 'van' | 'danfo' | 'keke' | 'okada';
export interface LaneDef { points: [number, number][]; vehicles: VehicleKind[]; speed: number }

/** One two-lane loop per road (drive on the right, U-turn at the ends). */
export const CITY_LANES: LaneDef[] = ROADS.map((r) => {
  const a = r.from + 4, b = r.to - 4;
  const points: [number, number][] = r.axis === 'z'
    ? [[r.at + 2.5, a], [r.at + 2.5, b], [r.at - 2.5, b], [r.at - 2.5, a]]
    : [[a, r.at - 2.5], [b, r.at - 2.5], [b, r.at + 2.5], [a, r.at + 2.5]];
  const vehicles: VehicleKind[] = r.id === 'boulevard' ? ['danfo', 'taxi', 'sedan', 'keke', 'suv', 'okada', 'danfo', 'taxi', 'van']
    : r.id === 'oja' ? ['keke', 'taxi', 'danfo', 'sedan', 'okada']
    : Math.abs(r.at) === 120 ? ['taxi', 'sedan', 'suv', 'van', 'keke']
    : ['van', 'sedan', 'taxi'];
  return { points, vehicles, speed: r.main ? 7 : Math.abs(r.at) === 240 ? 10 : 9 };
});

export const CITY_WALKWAYS: Rect[] = [...SIDEWALKS, ...CROSSINGS];

// ─────────────────────────────── GPS routing ───────────────────────────────

type Node = { x: number; z: number };

/** Shortest road route between two points (polyline in x/z), following the street grid. */
export function routeBetween(from: [number, number], to: [number, number]): [number, number][] {
  const nodes: Node[] = [];
  const idx = new Map<string, number>();
  const node = (x: number, z: number) => {
    const k = `${x.toFixed(2)},${z.toFixed(2)}`;
    if (!idx.has(k)) { idx.set(k, nodes.length); nodes.push({ x, z }); }
    return idx.get(k)!;
  };
  const adj: Map<number, { to: number; w: number }[]> = new Map();
  const link = (a: number, b: number) => {
    const w = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].z - nodes[b].z);
    (adj.get(a) ?? adj.set(a, []).get(a)!).push({ to: b, w });
    (adj.get(b) ?? adj.set(b, []).get(b)!).push({ to: a, w });
  };
  // Snap a point to the nearest road centre-line.
  const snap = (p: [number, number]) => {
    let best = { r: ROADS[0], along: 0, dist: Infinity };
    for (const r of ROADS) {
      const [across, along] = r.axis === 'z' ? [p[0] - r.at, p[1]] : [p[1] - r.at, p[0]];
      const cl = Math.max(r.from, Math.min(r.to, along));
      const dist = Math.hypot(across, along - cl);
      if (dist < best.dist) best = { r, along: cl, dist };
    }
    return best;
  };
  const s = snap(from), t = snap(to);
  for (const r of ROADS) {
    const stops = [r.from, r.to, ...crossings(r)];
    if (s.r === r) stops.push(s.along);
    if (t.r === r) stops.push(t.along);
    const sorted = [...new Set(stops.map((v) => +v.toFixed(2)))].sort((a, b) => a - b);
    const ids = sorted.map((v) => (r.axis === 'z' ? node(r.at, v) : node(v, r.at)));
    for (let k = 1; k < ids.length; k++) link(ids[k - 1], ids[k]);
  }
  const start = s.r.axis === 'z' ? node(s.r.at, +s.along.toFixed(2)) : node(+s.along.toFixed(2), s.r.at);
  const goal = t.r.axis === 'z' ? node(t.r.at, +t.along.toFixed(2)) : node(+t.along.toFixed(2), t.r.at);
  // Dijkstra (tiny graph: a few dozen nodes).
  const dist = nodes.map(() => Infinity), prev = nodes.map(() => -1), done = nodes.map(() => false);
  dist[start] = 0;
  for (;;) {
    let u = -1;
    for (let k = 0; k < nodes.length; k++) if (!done[k] && dist[k] < Infinity && (u < 0 || dist[k] < dist[u])) u = k;
    if (u < 0 || u === goal) break;
    done[u] = true;
    for (const e of adj.get(u) ?? []) if (dist[u] + e.w < dist[e.to]) { dist[e.to] = dist[u] + e.w; prev[e.to] = u; }
  }
  const path: [number, number][] = [to];
  for (let u = goal; u >= 0; u = prev[u]) path.push([nodes[u].x, nodes[u].z]);
  path.push(from);
  return path.reverse();
}

export const pathLength = (pts: [number, number][]) => pts.reduce((sum, p, k) => (k ? sum + Math.hypot(p[0] - pts[k - 1][0], p[1] - pts[k - 1][1]) : 0), 0);

// ─────────────────────────────── Map labels ───────────────────────────────

export const LANDMARK_NAMES: Record<LandmarkId, string> = {
  academy: 'BGAP Academy', spire: 'Data Spire', primary: 'Sunrise Primary', clinic: 'CareFirst Clinic', clock: 'Unity Clock Tower',
  apartments: 'Flats', bank: 'Meridian Capital', tower_meridian: 'Meridian Tower', tower_vantage: 'Vantage Insurance',
  tower_okeke: 'Okeke Foods', tower_lumen: 'Lumen Telecom', tower_kora: 'Kora Logistics', techhub: 'Datacore Hub', petrol: 'Atlas Fuel', gate: 'City Gate',
};

/** Named places for the map (landmarks plus the Market Boulevard story spots). */
export function mapPlaces(): { name: string; x: number; z: number; kind: 'landmark' | 'market' }[] {
  const out: { name: string; x: number; z: number; kind: 'landmark' | 'market' }[] = cityPlan().lots.filter((l) => l.kind === 'landmark').map((l) => ({
    name: l.landmark === 'apartments' ? `${String(l.props?.name ?? 'Flats')}` : LANDMARK_NAMES[l.landmark!], x: l.x, z: l.z, kind: 'landmark' as const,
  }));
  out.push(
    { name: "Mama Bisi's Café", x: 19, z: 56, kind: 'market' },
    { name: 'Open Market', x: -30, z: 14, kind: 'market' },
    { name: "Baba Sola's Kiosk", x: 18, z: -7.6, kind: 'market' },
    { name: 'Market Stop', x: 7, z: 22, kind: 'market' },
    { name: 'Zee Tailoring', x: -7.4, z: 31.6, kind: 'market' },
  );
  return out;
}
