'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import { PALETTE, seeded, pick } from './palette';
import { facadeTexture, shutterTexture, groundTexture } from './textures';
import { Box, Cyl, Panel, Sign, GableRoof, HipRoof, WaterTank, ACUnit, Generator, Awning, PalmTree, ShadeTree, CompoundWall, FlagPole, Planter, V3 } from './parts';

// Every building, house, bank, school, company and landmark in Data City.
// All names, logos and companies are fictional and original to the game.

type FacadeStyle = 'punched' | 'curtain' | 'band' | 'louvre';

/** A box with façade textures on its four walls. The workhorse of the kit. */
export function Block({ w, h, d, position = [0, 0, 0], wall, glass = PALETTE.glass.day, floorH = 3.2, bay = 2.6, style = 'punched', lit = 0.1, seed = 1, roof = PALETTE.trim.charcoal }: {
  w: number; h: number; d: number; position?: V3; wall: string; glass?: string; floorH?: number; bay?: number; style?: FacadeStyle; lit?: number; seed?: number; roof?: string;
}) {
  const rows = Math.max(1, Math.round(h / floorH));
  const front = useMemo(() => facadeTexture({ wall, glass, cols: Math.max(1, Math.round(w / bay)), rows, style, lit, seed }), [wall, glass, w, bay, rows, style, lit, seed]);
  const side = useMemo(() => facadeTexture({ wall, glass, cols: Math.max(1, Math.round(d / bay)), rows, style, lit, seed: seed + 1 }), [wall, glass, d, bay, rows, style, lit, seed]);
  const e = 0.01;
  return (
    <group position={position}>
      <Box size={[w, h, d]} position={[0, h / 2, 0]} color={wall} />
      <Panel w={w} h={h} map={front} position={[0, h / 2, d / 2 + e]} />
      <Panel w={w} h={h} map={front} position={[0, h / 2, -d / 2 - e]} rotation={[0, Math.PI, 0]} />
      <Panel w={d} h={h} map={side} position={[w / 2 + e, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} />
      <Panel w={d} h={h} map={side} position={[-w / 2 - e, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <Box size={[w + 0.2, 0.25, d + 0.2]} position={[0, h + 0.12, 0]} color={roof} />
    </group>
  );
}

function Pad({ w, d, kind = 'paving', color = PALETTE.ground.paving }: { w: number; d: number; kind?: 'paving' | 'laterite' | 'grass' | 'asphalt'; color?: string }) {
  const map = useMemo(() => {
    const t = groundTexture(kind, color).clone();
    t.repeat.set(w / 4, d / 4);
    t.needsUpdate = true;
    return t;
  }, [kind, color, w, d]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial map={map} roughness={0.95} />
    </mesh>
  );
}

function Door({ position, color = PALETTE.trim.teak, w = 1.1, h = 2.2 }: { position: V3; color?: string; w?: number; h?: number }) {
  return (
    <group position={position}>
      <Box size={[w + 0.2, h + 0.1, 0.08]} position={[0, h / 2, 0]} color={PALETTE.trim.white} />
      <Box size={[w, h, 0.1]} position={[0, h / 2, 0.03]} color={color} rough={0.6} />
    </group>
  );
}

function Railing({ w, position }: { w: number; position: V3 }) {
  const n = Math.round(w / 0.25);
  return (
    <group position={position}>
      <Box size={[w, 0.06, 0.06]} position={[0, 1, 0]} color={PALETTE.trim.charcoal} metal={0.5} />
      {Array.from({ length: n + 1 }).map((_, i) => (
        <Box key={i} size={[0.03, 1, 0.03]} position={[-w / 2 + (w / n) * i, 0.5, 0]} color={PALETTE.trim.charcoal} metal={0.5} cast={false} />
      ))}
    </group>
  );
}

// ───────────────────────────── Residential ─────────────────────────────

/** Single-storey family bungalow with veranda, hip roof and compound wall. */
export function Bungalow({ wall = PALETTE.walls.sand, roof = PALETTE.roofs.clay, gate = '#2F5D8A', seed = 2 }: { wall?: string; roof?: string; gate?: string; seed?: number }) {
  return (
    <group>
      <Pad w={17} d={15} kind="laterite" color={PALETTE.ground.laterite} />
      <Block w={11} h={3.3} d={8} position={[0, 0.3, -1.5]} wall={wall} bay={2.8} seed={seed} roof={wall} />
      <Box size={[12, 0.3, 10]} position={[0, 0.15, -0.8]} color={PALETTE.walls.concrete} />
      <HipRoof w={12.5} d={10.5} rise={2.4} position={[0, 3.7, -1]} color={roof} />
      {/* Veranda */}
      {[-4.5, -1.5, 1.5, 4.5].map((x) => <Cyl key={x} r={0.15} h={3.3} position={[x, 1.95, 3.6]} color={PALETTE.trim.white} seg={10} />)}
      <Door position={[0, 0.3, 2.52]} />
      <WaterTank position={[3.5, 3.6, -3.5]} />
      <ACUnit position={[5.65, 2.2, -1]} rotation={[0, Math.PI / 2, 0]} />
      <group position={[0, 0, 0]}><CompoundWall w={16} d={14} gateColor={gate} color={PALETTE.walls.cream} /></group>
      <PalmTree position={[-6, 0, 4.5]} height={5.5} seed={seed} />
      <Generator position={[6, 0, -5]} rotation={[0, -Math.PI / 2, 0]} />
    </group>
  );
}

/** Two-storey duplex with balcony and carport. Common in newer estates. */
export function Duplex({ wall = PALETTE.walls.whitewash, accent = PALETTE.walls.terracotta, roof = PALETTE.roofs.zincBlue, seed = 4 }: { wall?: string; accent?: string; roof?: string; seed?: number }) {
  return (
    <group>
      <Pad w={18} d={17} />
      <Block w={10} h={6.6} d={9} position={[-1.5, 0, -2]} wall={wall} bay={2.5} seed={seed} />
      <Block w={3.2} h={6.6} d={9.2} position={[3.2, 0, -2]} wall={accent} bay={3.2} seed={seed + 3} />
      <GableRoof w={13.4} d={9.4} rise={2.2} position={[0.1, 6.6, -2]} color={roof} />
      {/* Balcony */}
      <Box size={[6, 0.25, 1.8]} position={[-2.5, 3.3, 3.4]} color={PALETTE.walls.concrete} />
      <Railing w={6} position={[-2.5, 3.42, 4.25]} />
      <Door position={[-2.5, 0, 2.52]} color="#4B2E1B" w={1.6} />
      {/* Carport */}
      {[[4, 1], [4, 6], [8, 1], [8, 6]].map(([x, z], i) => <Cyl key={i} r={0.09} h={2.6} position={[x, 1.3, z]} color={PALETTE.trim.steel} metal={0.6} />)}
      <Box size={[4.6, 0.1, 5.6]} position={[6, 2.65, 3.5]} color={PALETTE.roofs.slate} metal={0.3} />
      <WaterTank position={[-7.4, 0, -6.6]} />
      <ACUnit position={[-6.55, 4.5, -2]} rotation={[0, -Math.PI / 2, 0]} />
      <ACUnit position={[-6.55, 1.5, -4]} rotation={[0, -Math.PI / 2, 0]} />
      <CompoundWall w={17} d={16} color={PALETTE.walls.sand} gateColor="#1F2A38" gateW={4} />
      <ShadeTree position={[-6.5, 0, 5]} scale={0.8} />
    </group>
  );
}

/** Four-storey block of flats with stacked balconies and a louvred stair core. */
export function ApartmentBlock({ name = 'ILÉ GARDENS', wall = PALETTE.walls.ochre, floors = 4, seed = 6 }: { name?: string; wall?: string; floors?: number; seed?: number }) {
  const h = floors * 3.1;
  return (
    <group>
      <Pad w={22} d={15} />
      <Block w={18} h={h} d={10} position={[0, 0, -1.5]} wall={wall} bay={3} seed={seed} lit={0.2} />
      <Block w={3.2} h={h + 1.5} d={10.4} position={[0, 0, -1.5]} wall={PALETTE.walls.cream} style="louvre" bay={3.2} floorH={3.1} seed={seed + 2} />
      {Array.from({ length: floors - 1 }).map((_, i) => (
        [-5.5, 5.5].map((x) => (
          <group key={`${i}${x}`}>
            <Box size={[5, 0.2, 1.4]} position={[x, 3.1 * (i + 1), 4.2]} color={PALETTE.walls.concrete} />
            <Railing w={5} position={[x, 3.1 * (i + 1) + 0.1, 4.85]} />
            {/* Laundry line, a small detail of lived-in flats */}
            {(i + x) % 2 === 0 && [0, 1, 2].map((k) => <Box key={k} size={[0.5, 0.7, 0.02]} position={[x - 1 + k * 0.9, 3.1 * (i + 1) + 1.4, 4.6]} color={pick(Object.values(PALETTE.fabric), seeded(seed + i * 7 + k))} cast={false} />)}
          </group>
        ))
      ))}
      <Sign text={name} w={3} h={0.7} position={[0, 2.6, 3.65]} bg={PALETTE.trim.charcoal} fg={PALETTE.trim.gold} />
      <Door position={[0, 0, 3.52]} color="#3A4450" w={1.6} />
      {[-6, -2.5, 3, 6.5].map((x, i) => <WaterTank key={x} position={[x, h + 0.25, -4 + (i % 2)]} />)}
      {[-8, 8].map((x) => <ACUnit key={x} position={[x, 5, 3.7]} />)}
      <Generator position={[9.5, 0, -6]} rotation={[0, -Math.PI / 2, 0]} />
    </group>
  );
}

// ───────────────────────────── Commercial ─────────────────────────────

export const SHOPS: { text: string; sub: string; bg: string; fg: string }[] = [
  { text: 'ADE PHONES', sub: 'Repairs • Accessories', bg: '#1F5FA8', fg: '#FFFFFF' },
  { text: 'GRACE PHARMACY', sub: 'Open 7am – 10pm', bg: '#2F8F5B', fg: '#FFFFFF' },
  { text: 'MAMA PUT', sub: 'Rice • Swallow • Pepper soup', bg: '#F2B134', fg: '#3A1A0A' },
  { text: 'POS HERE', sub: 'Withdrawal • Transfer', bg: '#D62839', fg: '#FFFFFF' },
  { text: 'FINE TOUCH', sub: 'Barbing Salon', bg: '#2B2F36', fg: '#F2B134' },
  { text: 'KOLA PRINTS', sub: 'Banners • Photocopy', bg: '#7B3FE4', fg: '#FFFFFF' },
  { text: 'ZEE FABRICS', sub: 'Ankara • Lace • Aso-oke', bg: '#C4302B', fg: '#FFF3D6' },
  { text: 'TOLU PROVISIONS', sub: 'Wholesale & Retail', bg: '#13837A', fg: '#FFFFFF' },
];

/** A terrace of lock-up shops with a residence above. Each unit has its own sign. */
export function ShopRow({ units = 4, start = 0, wall = PALETTE.walls.mint, seed = 8 }: { units?: number; start?: number; wall?: string; seed?: number }) {
  const uw = 4.2, w = units * uw;
  const shutter = useMemo(() => shutterTexture('#A6ADB4'), []);
  return (
    <group>
      <Pad w={w + 2} d={12} />
      <Block w={w} h={6.4} d={8} position={[0, 0, -2]} wall={wall} bay={2.1} seed={seed} lit={0.15} />
      {/* Shopfronts cover the ground-floor façade */}
      {Array.from({ length: units }).map((_, i) => {
        const shop = SHOPS[(start + i) % SHOPS.length];
        const x = -w / 2 + uw * (i + 0.5);
        const open = (i + seed) % 3 !== 0;
        return (
          <group key={i} position={[x, 0, 2.02]}>
            <Box size={[uw - 0.2, 2.9, 0.08]} position={[0, 1.45, 0]} color="#1C2026" />
            <mesh position={[0, open ? 2.55 : 1.45, 0.06]}>
              <planeGeometry args={[uw - 0.4, open ? 0.7 : 2.8]} />
              <meshStandardMaterial map={shutter} metalness={0.4} roughness={0.5} />
            </mesh>
            {open && <Box size={[uw - 0.5, 2, 0.04]} position={[0, 1.1, 0.04]} color={PALETTE.glass.shop} rough={0.15} metal={0.3} emissive="#FFE8B0" emissiveIntensity={0.25} />}
            <Sign text={shop.text} sub={shop.sub} w={uw - 0.3} h={0.9} position={[0, 3.45, 0.12]} bg={shop.bg} fg={shop.fg} lit />
            <Awning w={uw - 0.4} position={[0, 2.95, 0.15]} colors={[shop.bg, '#F3F1EC']} depth={1.1} />
            {i % 2 === 0 && <Box size={[1.1, 0.8, 0.6]} position={[1.2, 0.4, 1.2]} color="#8A5A34" />}
          </group>
        );
      })}
      {Array.from({ length: units }).map((_, i) => <ACUnit key={i} position={[-w / 2 + uw * (i + 0.5) + 1.2, 5, 2.2]} />)}
      {Array.from({ length: Math.ceil(units / 2) }).map((_, i) => <WaterTank key={i} position={[-w / 2 + 3 + i * 8, 6.65, -4]} />)}
      <Generator position={[w / 2 + 0.2, 0, 3.5]} rotation={[0, -Math.PI / 2, 0]} />
    </group>
  );
}

/** Open-air market: timber stalls under umbrellas with produce and fabric. */
export function MarketStalls({ count = 6, seed = 10 }: { count?: number; seed?: number }) {
  const rnd = seeded(seed);
  const umbrellas = [PALETTE.fabric.ankaraRed, PALETTE.fabric.ankaraBlue, PALETTE.fabric.ankaraYellow, PALETTE.fabric.ankaraGreen];
  const produce = ['#E0452B', '#F29E1F', '#5FA83A', '#7A3E8F', '#E8C547', '#B5361F'];
  return (
    <group>
      <Pad w={count * 2.2 + 2} d={9} kind="laterite" color={PALETTE.ground.laterite} />
      {Array.from({ length: count }).map((_, i) => {
        const x = -((count - 1) * 3.2) / 4 + (i % Math.ceil(count / 2)) * 3.2;
        const z = i < count / 2 ? -1.8 : 1.8;
        return (
          <group key={i} position={[x, 0, z]} rotation={[0, i < count / 2 ? 0 : Math.PI, 0]}>
            <Box size={[2.4, 0.9, 1.3]} position={[0, 0.45, 0]} color="#7A5236" rough={0.95} />
            {Array.from({ length: 6 }).map((_, k) => (
              <mesh key={k} position={[-0.9 + (k % 3) * 0.9, 1.0, -0.3 + Math.floor(k / 3) * 0.6]} castShadow>
                <sphereGeometry args={[0.22, 8, 6]} />
                <meshStandardMaterial color={pick(produce, rnd)} roughness={0.7} />
              </mesh>
            ))}
            <Cyl r={0.04} h={2.6} position={[0, 1.3, 0]} color="#555" metal={0.6} />
            <mesh position={[0, 2.6, 0]} castShadow>
              <coneGeometry args={[1.7, 0.6, 8, 1, true]} />
              <meshStandardMaterial color={umbrellas[i % umbrellas.length]} side={2} roughness={0.9} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Container kiosk selling airtime and doing POS transactions. */
export function Kiosk({ name = 'BABA SOLA', sub = 'Recharge • POS • Drinks', color = PALETTE.brand.atlas }: { name?: string; sub?: string; color?: string }) {
  return (
    <group>
      <Box size={[2.6, 2.5, 2]} position={[0, 1.25, 0]} color={color} metal={0.3} rough={0.55} />
      <Box size={[1.8, 1, 0.05]} position={[0, 1.4, 1.01]} color="#151A20" />
      <Box size={[2.2, 0.08, 0.8]} position={[0, 0.95, 1.3]} color="#7A5236" />
      <Box size={[3, 0.08, 1.4]} position={[0, 2.55, 0.5]} color={PALETTE.trim.charcoal} />
      <Sign text={name} sub={sub} w={2.4} h={0.6} position={[0, 2.95, 1.0]} bg="#FFFFFF" fg={PALETTE.trim.charcoal} />
      <Box size={[0.45, 0.8, 0.45]} position={[-1.7, 0.4, 1.2]} color="#1F5FA8" />
      <Box size={[0.5, 0.45, 0.5]} position={[1.6, 0.22, 1.3]} color="#D62839" />
    </group>
  );
}

/** Atlas Fuel filling station: canopy, four pumps and a forecourt shop. */
export function PetrolStation() {
  return (
    <group>
      <Pad w={26} d={20} kind="asphalt" color={PALETTE.ground.asphalt} />
      {[[-5, -3], [5, -3], [-5, 3], [5, 3]].map(([x, z], i) => <Cyl key={i} r={0.3} h={6} position={[x, 3, z]} color={PALETTE.trim.white} />)}
      <Box size={[16, 0.9, 10]} position={[0, 6.4, 0]} color={PALETTE.trim.white} />
      <Box size={[16.1, 0.5, 10.1]} position={[0, 6.1, 0]} color={PALETTE.brand.atlas} emissive={PALETTE.brand.atlas} emissiveIntensity={0.25} />
      {[[-5, 0], [0, 0], [5, 0]].map(([x], i) => (
        <group key={i} position={[x - 0, 0, 0]}>
          <Box size={[1.6, 0.25, 3]} position={[0, 0.12, 0]} color={PALETTE.walls.concrete} />
          <Box size={[0.7, 1.7, 0.5]} position={[0, 1.1, -0.6]} color="#F4F4F2" />
          <Box size={[0.72, 0.4, 0.52]} position={[0, 1.8, -0.6]} color={PALETTE.brand.atlas} />
          <Box size={[0.7, 1.7, 0.5]} position={[0, 1.1, 0.6]} color="#F4F4F2" />
          <Box size={[0.72, 0.4, 0.52]} position={[0, 1.8, 0.6]} color={PALETTE.brand.atlas} />
        </group>
      ))}
      <Block w={10} h={3.6} d={5} position={[0, 0, -8]} wall={PALETTE.walls.whitewash} style="band" bay={2} />
      <Sign text="ATLAS MART" w={5} h={0.8} position={[0, 3.2, -5.4]} bg={PALETTE.brand.atlas} fg="#1B1C20" lit />
      {/* Price totem */}
      <group position={[11, 0, 8]}>
        <Box size={[1.6, 6, 0.5]} position={[0, 3, 0]} color={PALETTE.trim.white} />
        <Sign text="ATLAS" sub="FUEL" w={1.5} h={1.4} position={[0, 5, 0.26]} bg={PALETTE.brand.atlas} fg="#1B1C20" lit />
        <Sign text="PMS 980" w={1.4} h={0.5} position={[0, 3.6, 0.26]} bg="#111" fg="#F2B705" lit />
        <Sign text="AGO 1,250" w={1.4} h={0.5} position={[0, 3, 0.26]} bg="#111" fg="#F2B705" lit />
      </group>
    </group>
  );
}

/** Mama Bisi's Café: the Chapter 1 location. Patio, awning and laptop table. */
export function CafeBisi() {
  return (
    <group>
      <Pad w={18} d={14} />
      <Block w={14} h={4.2} d={9} position={[0, 0, -2.5]} wall={PALETTE.walls.terracotta} bay={3.5} style="punched" seed={21} lit={0.6} />
      <Box size={[12, 2.8, 0.06]} position={[0, 1.6, 2.03]} color={PALETTE.glass.lit} emissive="#FFC46B" emissiveIntensity={0.5} rough={0.2} />
      <Sign text="MAMA BISI'S" sub="Café • Small chops • Catering" w={7} h={1.1} position={[0, 3.6, 2.15]} bg={PALETTE.trim.teak} fg="#FFE3A3" lit />
      <Awning w={12} position={[0, 3, 2.15]} colors={['#B23A2B', '#F3E5C8']} depth={2.4} />
      {[-4, 0, 4].map((x) => (
        <group key={x} position={[x, 0, 5]}>
          <Cyl r={0.5} h={0.05} position={[0, 0.75, 0]} color="#F2E8D5" />
          <Cyl r={0.05} h={0.75} position={[0, 0.37, 0]} color="#333" />
          {[-0.8, 0.8].map((dx) => <Box key={dx} size={[0.45, 0.45, 0.45]} position={[dx, 0.25, 0]} color={PALETTE.trim.teak} />)}
        </group>
      ))}
      {/* Mission laptop on the corner table */}
      <Box size={[0.42, 0.02, 0.3]} position={[4, 0.8, 5]} color="#2B2F36" metal={0.6} />
      <Box size={[0.42, 0.28, 0.02]} position={[4, 0.95, 4.86]} rotation={[-0.25, 0, 0]} color="#0F1626" emissive="#00B8C9" emissiveIntensity={0.8} />
      <Planter position={[-7.5, 0, 4]} w={1.4} />
      <Planter position={[7.5, 0, 4]} w={1.4} />
      <WaterTank position={[4, 4.45, -5]} />
      <Generator position={[-8.2, 0, -4]} rotation={[0, Math.PI / 2, 0]} />
    </group>
  );
}

// ─────────────────────────── Education & civic ───────────────────────────

/** BGAP Academy: the player's home base. Three storeys with open corridors. */
export function AcademyCampus() {
  return (
    <group>
      <Pad w={44} d={26} />
      <Block w={36} h={10.5} d={10} position={[0, 0, -5]} wall={PALETTE.walls.whitewash} style="band" bay={3} floorH={3.5} glass={PALETTE.glass.day} seed={30} lit={0.25} />
      {/* Corridor galleries with railings */}
      {[3.5, 7].map((y) => (
        <group key={y}>
          <Box size={[36, 0.25, 2]} position={[0, y, 1]} color={PALETTE.walls.concrete} />
          <Railing w={36} position={[0, y + 0.12, 1.95]} />
        </group>
      ))}
      {Array.from({ length: 10 }).map((_, i) => <Cyl key={i} r={0.22} h={10.5} position={[-16.2 + i * 3.6, 5.25, 1.9]} color={PALETTE.trim.white} seg={10} />)}
      <Box size={[36.6, 0.6, 12.6]} position={[0, 10.8, -4]} color={PALETTE.brand.bgap} />
      {/* Entrance portal */}
      <Box size={[8, 12.5, 1.2]} position={[0, 6.25, 2.6]} color={PALETTE.trim.charcoal} />
      <Box size={[5, 3, 0.1]} position={[0, 1.5, 3.25]} color={PALETTE.glass.day} rough={0.1} metal={0.4} emissive="#BFE8EE" emissiveIntensity={0.15} />
      <Sign text="BGAP ACADEMY" sub="School of Data & Analytics" w={7.4} h={1.6} position={[0, 9.6, 3.25]} bg={PALETTE.trim.charcoal} fg={PALETTE.brand.bgap} lit />
      <FlagPole position={[-8, 0, 9]} />
      <FlagPole position={[8, 0, 9]} color={PALETTE.brand.meridianGold} />
      {[-14, -6, 6, 14].map((x) => <Planter key={x} position={[x, 0, 7]} w={2.2} />)}
      <PalmTree position={[-19, 0, 8]} seed={3} />
      <PalmTree position={[19, 0, 8]} seed={7} />
    </group>
  );
}

/** Sunrise Primary School: single-storey classrooms around a play yard. */
export function PrimarySchool() {
  return (
    <group>
      <Pad w={30} d={22} kind="laterite" color={PALETTE.ground.laterite} />
      <Block w={24} h={3.4} d={7} position={[0, 0, -6]} wall={PALETTE.walls.sky} bay={3} seed={40} roof={PALETTE.walls.sky} />
      <GableRoof w={24} d={9} rise={1.8} position={[0, 3.4, -6]} color={PALETTE.roofs.green} />
      <Box size={[24, 0.2, 2]} position={[0, 0.1, -1.6]} color={PALETTE.walls.concrete} />
      <Sign text="SUNRISE PRIMARY SCHOOL" sub="Knowledge is light" w={9} h={1.4} position={[0, 1.2, 10]} bg="#1F5FA8" fg="#FFFFFF" />
      {[-4.6, 4.6].map((x) => <Box key={x} size={[0.2, 2.6, 0.2]} position={[x, 1.3, 10]} color={PALETTE.trim.charcoal} />)}
      {/* Swing set and goalposts */}
      <group position={[-8, 0, 3]}>
        {[-1.2, 1.2].map((x) => <Box key={x} size={[0.1, 2.6, 0.1]} position={[x, 1.3, 0]} color="#D62839" />)}
        <Box size={[2.6, 0.1, 0.1]} position={[0, 2.6, 0]} color="#D62839" />
        <Box size={[0.6, 0.06, 0.25]} position={[0, 0.6, 0]} color="#F2B134" />
      </group>
      {[6, 11].map((x) => (
        <group key={x} position={[x, 0, 3]}>
          <Box size={[0.08, 1.8, 0.08]} position={[0, 0.9, -1.5]} color="#FFFFFF" />
          <Box size={[0.08, 1.8, 0.08]} position={[0, 0.9, 1.5]} color="#FFFFFF" />
          <Box size={[0.08, 0.08, 3]} position={[0, 1.8, 0]} color="#FFFFFF" />
        </group>
      ))}
      <FlagPole position={[0, 0, 4]} color="#2F8F5B" />
      <ShadeTree position={[-12, 0, -1]} />
    </group>
  );
}

/** CareFirst Clinic: a small two-storey health centre. */
export function Clinic() {
  return (
    <group>
      <Pad w={18} d={14} />
      <Block w={14} h={6.6} d={9} position={[0, 0, -2]} wall={PALETTE.walls.whitewash} bay={2.4} seed={50} lit={0.3} />
      <Box size={[14.2, 0.6, 9.2]} position={[0, 3.3, -2]} color="#2F8F5B" />
      <Box size={[1.6, 0.5, 0.2]} position={[5, 5.2, 2.6]} color="#2F8F5B" emissive="#2F8F5B" emissiveIntensity={0.6} />
      <Box size={[0.5, 1.6, 0.2]} position={[5, 5.2, 2.6]} color="#2F8F5B" emissive="#2F8F5B" emissiveIntensity={0.6} />
      <Sign text="CAREFIRST CLINIC" sub="24-hour emergency" w={6} h={1} position={[-2.5, 5, 2.6]} bg="#FFFFFF" fg="#2F8F5B" lit />
      <Box size={[6, 0.15, 3]} position={[0, 3, 3.8]} color={PALETTE.trim.white} />
      <Door position={[0, 0, 2.52]} color={PALETTE.glass.day} w={2.4} />
      <Box size={[3, 0.3, 2]} position={[4, 0.15, 4]} color={PALETTE.walls.concrete} />
    </group>
  );
}

// ─────────────────────────── Finance & companies ───────────────────────────

/** Meridian Capital Bank: branch with columned portico and ATM gallery. Chapter 2 hub. */
export function BankBranch() {
  return (
    <group>
      <Pad w={26} d={18} />
      <Block w={20} h={8} d={11} position={[0, 0, -3]} wall={PALETTE.walls.cream} style="curtain" glass={PALETTE.glass.tower} bay={2} floorH={4} seed={60} lit={0.2} />
      <Box size={[22, 1.2, 13]} position={[0, 8.6, -3]} color={PALETTE.brand.meridian} />
      <Box size={[22.1, 0.25, 13.1]} position={[0, 8, -3]} color={PALETTE.brand.meridianGold} metal={0.7} rough={0.3} />
      {/* Portico */}
      <Box size={[12, 0.5, 4]} position={[0, 6.2, 4.5]} color={PALETTE.walls.whitewash} />
      {[-5, -2.5, 0, 2.5, 5].map((x) => <Cyl key={x} r={0.35} h={6} position={[x, 3.1, 6]} color={PALETTE.walls.whitewash} seg={16} />)}
      <Box size={[13, 0.3, 5.5]} position={[0, 0.15, 4.5]} color={PALETTE.walls.concrete} />
      <Sign text="MERIDIAN CAPITAL" sub="BANK" w={10} h={1.8} position={[0, 9.4, 3.55]} bg={PALETTE.brand.meridian} fg={PALETTE.brand.meridianGold} lit />
      {/* ATM gallery */}
      <group position={[8.5, 0, 2.6]}>
        <Box size={[3.4, 3, 0.1]} position={[0, 1.5, 0]} color={PALETTE.brand.meridian} />
        {[-1, 0, 1].map((x) => (
          <group key={x} position={[x, 0, 0.1]}>
            <Box size={[0.75, 1.7, 0.4]} position={[0, 0.85, 0.15]} color="#2B2F36" metal={0.5} />
            <Box size={[0.4, 0.3, 0.02]} position={[0, 1.3, 0.36]} color="#00B8C9" emissive="#00B8C9" emissiveIntensity={0.8} />
          </group>
        ))}
        <Sign text="ATM" w={1.2} h={0.5} position={[0, 2.6, 0.08]} bg={PALETTE.brand.meridianGold} fg={PALETTE.brand.meridian} lit />
      </group>
      {/* Security post */}
      <Box size={[1.6, 2.4, 1.6]} position={[-11, 1.2, 6]} color={PALETTE.walls.concrete} />
      <Box size={[1.8, 0.15, 1.8]} position={[-11, 2.45, 6]} color={PALETTE.brand.meridian} />
      <Box size={[1.62, 0.8, 0.02]} position={[-11, 1.6, 6.81]} color={PALETTE.glass.day} />
      {[-9, 9].map((x) => <Planter key={x} position={[x, 0, 7.6]} w={2} />)}
    </group>
  );
}

export interface CompanyDef { name: string; sub: string; brand: string; floors: number; style: FacadeStyle; glass: string; wall: string; crown: 'mast' | 'fin' | 'flat' | 'halo' }

export const COMPANIES: Record<string, CompanyDef> = {
  kora: { name: 'KORA LOGISTICS', sub: 'Freight • Last-mile', brand: PALETTE.brand.kora, floors: 10, style: 'band', glass: PALETTE.glass.tower, wall: PALETTE.walls.concrete, crown: 'fin' },
  lumen: { name: 'LUMEN TELECOM', sub: 'Connecting every street', brand: PALETTE.brand.lumen, floors: 16, style: 'curtain', glass: PALETTE.glass.towerDark, wall: PALETTE.glass.towerDark, crown: 'mast' },
  vantage: { name: 'VANTAGE INSURANCE', sub: 'Cover that keeps its word', brand: PALETTE.brand.vantage, floors: 12, style: 'louvre', glass: PALETTE.glass.day, wall: PALETTE.walls.whitewash, crown: 'flat' },
  okeke: { name: 'OKEKE FOODS', sub: 'From farm to family', brand: PALETTE.brand.okeke, floors: 7, style: 'punched', glass: PALETTE.glass.day, wall: PALETTE.walls.sand, crown: 'halo' },
  meridianHQ: { name: 'MERIDIAN TOWER', sub: 'Meridian Capital HQ', brand: PALETTE.brand.meridianGold, floors: 22, style: 'curtain', glass: PALETTE.glass.tower, wall: PALETTE.glass.tower, crown: 'halo' },
};

/** Parametric company tower: podium, shaft, branded crown. */
export function OfficeTower({ company = 'kora' }: { company?: keyof typeof COMPANIES | string }) {
  const c = COMPANIES[company] ?? COMPANIES.kora;
  const fh = 3.6, h = c.floors * fh;
  const crownRef = useRef<Group>(null);
  useFrame((_, dt) => { if (crownRef.current && c.crown === 'halo') crownRef.current.rotation.y += dt * 0.2; });
  return (
    <group>
      <Pad w={26} d={26} />
      <Block w={22} h={7.2} d={20} position={[0, 0, -1]} wall={PALETTE.walls.concrete} style="curtain" glass={PALETTE.glass.shop} bay={3} floorH={3.6} seed={70} lit={0.4} />
      <Block w={16} h={h} d={14} position={[0, 7.2, -2]} wall={c.wall} style={c.style} glass={c.glass} bay={2.4} floorH={fh} seed={c.name.length} lit={0.3} />
      <Box size={[16.4, 0.5, 0.5]} position={[0, 7.2 + h * 0.5, 5.25]} color={c.brand} emissive={c.brand} emissiveIntensity={0.3} />
      <Sign text={c.name} sub={c.sub} w={12} h={2} position={[0, 5.6, 9.05]} bg={PALETTE.trim.charcoal} fg="#FFFFFF" lit />
      <Box size={[1.2, 1.2, 0.2]} position={[0, 5.6, 9.2]} color={c.brand} emissive={c.brand} emissiveIntensity={0.4} />
      <Sign text={c.name.split(' ')[0]} w={8} h={1.6} position={[0, 7.2 + h - 1.6, 5.05]} bg={c.brand} fg="#FFFFFF" lit />
      <group ref={crownRef} position={[0, 7.2 + h + 0.25, -2]}>
        {c.crown === 'mast' && (<><Cyl r={0.25} rTop={0.06} h={12} position={[0, 6, 0]} color={PALETTE.trim.steel} metal={0.8} />{[3, 6, 9].map((y) => <Cyl key={y} r={1.2 - y * 0.08} h={0.1} position={[0, y, 0]} color={PALETTE.trim.steel} metal={0.8} />)}<mesh position={[0, 12.2, 0]}><sphereGeometry args={[0.2, 8, 6]} /><meshBasicMaterial color="#FF3B30" /></mesh></>)}
        {c.crown === 'fin' && <Box size={[1.2, 8, 10]} position={[5, 4, 0]} color={c.brand} emissive={c.brand} emissiveIntensity={0.2} />}
        {c.crown === 'flat' && <Box size={[12, 2, 10]} position={[0, 1, 0]} color={PALETTE.walls.concrete} />}
        {c.crown === 'halo' && (
          <mesh position={[0, 2.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[7, 0.35, 8, 48]} />
            <meshStandardMaterial color={c.brand} emissive={c.brand} emissiveIntensity={0.7} metalness={0.6} roughness={0.3} />
          </mesh>
        )}
      </group>
      {[-9, 9].map((x) => <PalmTree key={x} position={[x, 0, 11]} seed={x} />)}
    </group>
  );
}

/** Datacore Tech Hub: low data centre with cooling units and a server-light façade. */
export function TechHub() {
  return (
    <group>
      <Pad w={30} d={22} kind="asphalt" color={PALETTE.ground.asphalt} />
      <Block w={24} h={7} d={14} position={[0, 0, -2]} wall="#2A3340" style="band" glass="#0E2A3A" bay={1.6} floorH={3.5} seed={80} lit={0.05} />
      <Box size={[24.2, 0.3, 0.2]} position={[0, 3.5, 5.15]} color="#00B8C9" emissive="#00B8C9" emissiveIntensity={1.2} />
      <Sign text="DATACORE" sub="Tech Hub & Server Farm" w={8} h={1.4} position={[0, 5.5, 5.2]} bg="#0F1626" fg="#00D9E6" lit />
      {Array.from({ length: 6 }).map((_, i) => (
        <group key={i} position={[-10 + i * 4, 7, -2]}>
          <Box size={[3, 1.4, 3]} position={[0, 0.7, 0]} color="#8A939E" metal={0.6} rough={0.4} />
          <Cyl r={1.1} h={0.1} position={[0, 1.45, 0]} color="#2B2F36" />
        </group>
      ))}
      {/* Security fence */}
      {Array.from({ length: 15 }).map((_, i) => <Box key={i} size={[0.08, 2.4, 0.08]} position={[-14 + i * 2, 1.2, 10.5]} color={PALETTE.trim.steel} metal={0.6} />)}
      <Box size={[28, 0.06, 0.06]} position={[0, 2.3, 10.5]} color={PALETTE.trim.steel} metal={0.6} />
      <Box size={[28, 0.06, 0.06]} position={[0, 1.2, 10.5]} color={PALETTE.trim.steel} metal={0.6} />
      <Generator position={[13, 0, -4]} rotation={[0, -Math.PI / 2, 0]} />
      <Generator position={[13, 0, -7]} rotation={[0, -Math.PI / 2, 0]} />
    </group>
  );
}

// ───────────────────────────── Landmarks ─────────────────────────────

/** The Data Spire: the city's centrepiece monument in Academy Plaza. */
export function DataSpire() {
  const rings = useRef<Group>(null);
  useFrame((_, dt) => { if (rings.current) rings.current.rotation.y += dt * 0.4; });
  return (
    <group>
      <Cyl r={7} h={0.4} position={[0, 0.2, 0]} color={PALETTE.ground.paving} seg={32} />
      <Cyl r={5.5} h={0.6} position={[0, 0.5, 0]} color={PALETTE.walls.concrete} seg={32} />
      {/* Fountain ring */}
      <mesh position={[0, 0.82, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.2, 5.2, 48]} />
        <meshStandardMaterial color="#4FA9C9" roughness={0.1} metalness={0.3} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 9, 0]} castShadow>
        <cylinderGeometry args={[0.2, 1.6, 17, 6]} />
        <meshStandardMaterial color="#1B2A3A" metalness={0.8} roughness={0.25} flatShading />
      </mesh>
      <group ref={rings}>
        {[5, 9, 13].map((y, i) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2 + (i - 1) * 0.15, 0, 0]}>
            <torusGeometry args={[2.4 - i * 0.5, 0.07, 6, 48]} />
            <meshStandardMaterial color={PALETTE.brand.bgap} emissive={PALETTE.brand.bgap} emissiveIntensity={1.4} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 17.8, 0]}>
        <octahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial color="#FFFFFF" emissive={PALETTE.brand.bgap} emissiveIntensity={2} />
      </mesh>
      <Sign text="DATA CITY" sub="Est. 2026" w={3.4} h={0.9} position={[0, 1.4, 3.2]} bg={PALETTE.trim.charcoal} fg={PALETTE.trim.gold} rotation={[-0.3, 0, 0]} />
    </group>
  );
}

/** Unity Clock Tower: a four-faced clock at the centre of a roundabout. */
export function ClockTower() {
  return (
    <group>
      <Cyl r={9} h={0.3} position={[0, 0.15, 0]} color={PALETTE.ground.grass} seg={40} />
      <Cyl r={9.2} h={0.35} position={[0, 0.12, 0]} color={PALETTE.ground.kerb} seg={40} />
      <Box size={[3.4, 1, 3.4]} position={[0, 0.8, 0]} color={PALETTE.walls.concrete} />
      <Box size={[2.4, 12, 2.4]} position={[0, 7, 0]} color={PALETTE.walls.cream} />
      {[0, 1, 2, 3].map((i) => (
        <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
          <mesh position={[0, 11, 1.22]}><circleGeometry args={[0.95, 32]} /><meshStandardMaterial color="#FAF7EF" emissive="#FFF5D6" emissiveIntensity={0.3} /></mesh>
          <Box size={[0.06, 0.7, 0.02]} position={[0, 11.3, 1.25]} color="#1B1C20" cast={false} />
          <Box size={[0.5, 0.06, 0.02]} position={[0.22, 11, 1.25]} color="#1B1C20" cast={false} />
        </group>
      ))}
      <mesh position={[0, 14, 0]} castShadow><coneGeometry args={[2, 3, 4]} /><meshStandardMaterial color={PALETTE.roofs.green} flatShading /></mesh>
      {Array.from({ length: 8 }).map((_, i) => <Planter key={i} position={[Math.cos((i / 8) * Math.PI * 2) * 6, 0.3, Math.sin((i / 8) * Math.PI * 2) * 6]} w={1.2} />)}
    </group>
  );
}

/** Pedestrian footbridge over the boulevard, with an advertising banner. */
export function PedestrianBridge({ span = 22 }: { span?: number }) {
  return (
    <group>
      {[-span / 2, span / 2].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <Box size={[2.4, 6, 2.4]} position={[0, 3, 0]} color={PALETTE.walls.concrete} />
          {/* Stairs */}
          {Array.from({ length: 12 }).map((_, i) => <Box key={i} size={[2, 0.25, 0.5]} position={[Math.sign(x) * 1.7, 0.25 + i * 0.5, -2.5 + i * 0.45]} color={PALETTE.walls.concrete} />)}
        </group>
      ))}
      <Box size={[span + 2.4, 0.5, 2.4]} position={[0, 6.2, 0]} color={PALETTE.walls.concrete} />
      <Railing w={span + 2} position={[0, 6.45, 1.15]} />
      <Railing w={span + 2} position={[0, 6.45, -1.15]} />
      <Sign text="LUMEN 5G" sub="Faster than your gist" w={10} h={1.8} position={[0, 5, 1.25]} bg={PALETTE.brand.lumen} fg="#FFFFFF" lit />
    </group>
  );
}

/** The city gate arch at the main road into Data City. */
export function CityGate() {
  return (
    <group>
      {[-9, 9].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <Box size={[2.6, 10, 2.6]} position={[0, 5, 0]} color={PALETTE.walls.terracotta} />
          <Box size={[3, 0.6, 3]} position={[0, 10.3, 0]} color={PALETTE.trim.charcoal} />
          <Box size={[3, 0.8, 3]} position={[0, 0.4, 0]} color={PALETTE.walls.concrete} />
        </group>
      ))}
      <Box size={[21, 2.2, 1.6]} position={[0, 9, 0]} color={PALETTE.walls.terracotta} />
      <Sign text="WELCOME TO DATA CITY" sub="Where every number tells a story" w={15} h={1.7} position={[0, 9, 0.85]} bg={PALETTE.trim.charcoal} fg={PALETTE.trim.gold} lit />
      <Sign text="SAFE JOURNEY" w={8} h={1.2} position={[0, 9, -0.85]} rotation={[0, Math.PI, 0]} bg={PALETTE.trim.charcoal} fg={PALETTE.trim.gold} />
    </group>
  );
}

/** A Danfo-style bus stop shelter with bench and timetable. */
export function BusStop({ name = 'ACADEMY JUNCTION' }: { name?: string }) {
  return (
    <group>
      <Box size={[5, 0.2, 2.2]} position={[0, 0.1, 0]} color={PALETTE.ground.kerb} />
      {[-2.2, 2.2].map((x) => <Box key={x} size={[0.12, 2.6, 0.12]} position={[x, 1.4, -0.8]} color={PALETTE.trim.steel} metal={0.6} />)}
      <Box size={[5, 0.12, 2]} position={[0, 2.75, -0.1]} rotation={[0.08, 0, 0]} color={PALETTE.brand.bgap} />
      <Box size={[4.6, 2.2, 0.05]} position={[0, 1.5, -0.85]} color={PALETTE.glass.day} rough={0.1} metal={0.3} />
      <Box size={[3, 0.1, 0.45]} position={[0, 0.55, -0.5]} color={PALETTE.trim.teak} />
      <Sign text={name} sub="BRT • Danfo • Keke" w={2.6} h={0.6} position={[0, 2.35, -0.8]} bg={PALETTE.trim.charcoal} fg="#FFFFFF" />
    </group>
  );
}
