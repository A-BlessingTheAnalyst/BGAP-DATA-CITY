'use client';
import { useMemo } from 'react';
import { Shape, Texture } from 'three';
import { PALETTE } from './palette';
import { signTexture, corrugatedTexture } from './textures';

// Small reusable pieces every building is assembled from.
// Units are metres. Origin sits on the ground; the "front" of every asset faces +Z.

export type V3 = [number, number, number];

export function Box({ size, position = [0, 0, 0], color = '#cccccc', map, rough = 0.85, metal = 0, emissive, emissiveIntensity = 1, rotation, cast = true }: {
  size: V3; position?: V3; color?: string; map?: Texture; rough?: number; metal?: number; emissive?: string; emissiveIntensity?: number; rotation?: V3; cast?: boolean;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow={cast} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} map={map} roughness={rough} metalness={metal} emissive={emissive ?? '#000000'} emissiveIntensity={emissive ? emissiveIntensity : 0} />
    </mesh>
  );
}

export function Cyl({ r, h, position = [0, 0, 0], color, rough = 0.8, metal = 0, seg = 16, rotation, rTop }: {
  r: number; h: number; position?: V3; color: string; rough?: number; metal?: number; seg?: number; rotation?: V3; rTop?: number;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <cylinderGeometry args={[rTop ?? r, r, h, seg]} />
      <meshStandardMaterial color={color} roughness={rough} metalness={metal} />
    </mesh>
  );
}

/** A flat panel showing a texture, e.g. a façade or sign face. */
export function Panel({ w, h, map, position, rotation, emissive = false, intensity = 0.6 }: {
  w: number; h: number; map: Texture; position: V3; rotation?: V3; emissive?: boolean; intensity?: number;
}) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial map={map} roughness={0.7} emissiveMap={emissive ? map : undefined} emissive={emissive ? '#ffffff' : '#000000'} emissiveIntensity={emissive ? intensity : 0} />
    </mesh>
  );
}

/** Shop or company sign with real lettering. Lightbox signs glow. */
export function Sign({ text, sub, w, h, position, bg, fg = '#ffffff', lit = false, depth = 0.15, rotation }: {
  text: string; sub?: string; w: number; h: number; position: V3; bg: string; fg?: string; lit?: boolean; depth?: number; rotation?: V3;
}) {
  const map = useMemo(() => signTexture(text, bg, fg, { sub, w: 1024, h: Math.round((1024 * h) / w) }), [text, sub, bg, fg, w, h]);
  return (
    <group position={position} rotation={rotation}>
      <Box size={[w, h, depth]} color={bg} cast={false} />
      <Panel w={w} h={h} map={map} position={[0, 0, depth / 2 + 0.005]} emissive={lit} intensity={0.9} />
    </group>
  );
}

/** Pitched corrugated roof. `hip` adds end slopes for bungalow-style roofs. */
export function GableRoof({ w, d, rise, position, color = PALETTE.roofs.rust, overhang = 0.4 }: {
  w: number; d: number; rise: number; position: V3; color?: string; overhang?: number;
}) {
  const map = useMemo(() => {
    const t = corrugatedTexture(color).clone();
    t.repeat.set(w / 2, 1);
    t.needsUpdate = true;
    return t;
  }, [color, w]);
  const half = d / 2 + overhang;
  const slope = Math.hypot(half, rise);
  const ang = Math.atan2(rise, half);
  return (
    <group position={position}>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, rise / 2, (s * half) / 2]} rotation={[s * ang, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[w + overhang * 2, 0.06, slope]} />
          <meshStandardMaterial map={map} color="#ffffff" roughness={0.6} metalness={0.3} />
        </mesh>
      ))}
      {/* Gable end walls */}
      {[1, -1].map((s) => (
        <mesh key={'g' + s} position={[(s * w) / 2, 0, 0]} rotation={[0, s * Math.PI / 2, 0]} castShadow>
          <shapeGeometry args={[triangle(d, rise)]} />
          <meshStandardMaterial color={PALETTE.walls.cream} side={2} />
        </mesh>
      ))}
    </group>
  );
}

function triangle(d: number, rise: number) {
  const s = new Shape();
  s.moveTo(-d / 2, 0);
  s.lineTo(d / 2, 0);
  s.lineTo(0, rise);
  s.closePath();
  return s;
}

/** Hipped roof: a squashed four-sided pyramid. */
export function HipRoof({ w, d, rise, position, color = PALETTE.roofs.clay }: { w: number; d: number; rise: number; position: V3; color?: string }) {
  const map = useMemo(() => corrugatedTexture(color), [color]);
  return (
    <mesh position={[position[0], position[1] + rise / 2, position[2]]} scale={[w * 0.75, 1, d * 0.75]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
      <coneGeometry args={[1, rise, 4, 1]} />
      <meshStandardMaterial map={map} color="#ffffff" roughness={0.65} metalness={0.25} flatShading />
    </mesh>
  );
}

/** Black plastic rooftop water tank on a steel stand: on almost every Lagos roof. */
export function WaterTank({ position, color = '#1C1F24' }: { position: V3; color?: string }) {
  return (
    <group position={position}>
      {[[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].map(([x, z], i) => (
        <Box key={i} size={[0.08, 1.2, 0.08]} position={[x, 0.6, z]} color={PALETTE.trim.steel} metal={0.6} rough={0.5} />
      ))}
      <Box size={[1.2, 0.06, 1.2]} position={[0, 1.2, 0]} color={PALETTE.trim.steel} metal={0.6} />
      <Cyl r={0.6} h={1.2} position={[0, 1.83, 0]} color={color} rough={0.5} seg={20} />
      <Cyl r={0.2} h={0.12} position={[0, 2.49, 0]} color={color} />
    </group>
  );
}

export function ACUnit({ position, rotation }: { position: V3; rotation?: V3 }) {
  return (
    <group position={position} rotation={rotation}>
      <Box size={[0.8, 0.55, 0.3]} color="#E9E9E6" rough={0.5} />
      <Cyl r={0.2} h={0.02} position={[0.15, 0, 0.16]} rotation={[Math.PI / 2, 0, 0]} color="#7B8087" />
    </group>
  );
}

/** Diesel generator in a steel housing, the soundtrack of every commercial street. */
export function Generator({ position, rotation }: { position: V3; rotation?: V3 }) {
  return (
    <group position={position} rotation={rotation}>
      <Box size={[1.6, 1.1, 0.9]} position={[0, 0.55, 0]} color="#C9A227" rough={0.5} metal={0.3} />
      <Box size={[1.4, 0.4, 0.02]} position={[0, 0.7, 0.46]} color="#3A3A3A" />
      <Cyl r={0.06} h={0.6} position={[0.6, 1.3, -0.2]} color="#555" metal={0.6} />
    </group>
  );
}

/** Striped canvas awning over a shopfront. */
export function Awning({ w, position, colors = ['#D62839', '#F3F1EC'], depth = 1.4 }: { w: number; position: V3; colors?: [string, string]; depth?: number }) {
  const stripes = Math.max(4, Math.round(w / 0.5));
  return (
    <group position={position} rotation={[0.35, 0, 0]}>
      {Array.from({ length: stripes }).map((_, i) => (
        <Box key={i} size={[w / stripes, 0.05, depth]} position={[-w / 2 + (w / stripes) * (i + 0.5), 0, depth / 2]} color={colors[i % 2]} rough={0.9} />
      ))}
    </group>
  );
}

export function PalmTree({ position, height = 6, seed = 0 }: { position: V3; height?: number; seed?: number }) {
  const lean = ((seed % 5) - 2) * 0.04;
  return (
    <group position={position} rotation={[lean, seed, lean * 0.5]}>
      <Cyl r={0.18} rTop={0.13} h={height} position={[0, height / 2, 0]} color={PALETTE.nature.trunk} seg={8} />
      {Array.from({ length: 8 }).map((_, i) => (
        <group key={i} position={[0, height, 0]} rotation={[0, (i / 8) * Math.PI * 2, 0]}>
          <mesh position={[0, -0.2, 1.1]} rotation={[0.55, 0, 0]} castShadow>
            <boxGeometry args={[0.55, 0.03, 2.4]} />
            <meshStandardMaterial color={i % 2 ? PALETTE.nature.palm : PALETTE.nature.leafLight} roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function ShadeTree({ position, scale = 1 }: { position: V3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <Cyl r={0.22} rTop={0.16} h={2.4} position={[0, 1.2, 0]} color={PALETTE.nature.trunk} seg={8} />
      {[[0, 3.2, 0, 1.6], [0.9, 2.8, 0.3, 1.1], [-0.8, 2.9, -0.4, 1.2], [0.2, 3.9, -0.3, 1.1]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial color={i % 2 ? PALETTE.nature.leaf : PALETTE.nature.leafLight} roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  );
}

/** Compound wall with a painted steel gate: the boundary of nearly every house. */
export function CompoundWall({ w, d, h = 2.2, gateW = 3.2, color = PALETTE.walls.cream, gateColor = '#2F5D8A' }: {
  w: number; d: number; h?: number; gateW?: number; color?: string; gateColor?: string;
}) {
  const t = 0.22, side = (w - gateW) / 2;
  return (
    <group>
      <Box size={[t, h, d]} position={[-w / 2, h / 2, 0]} color={color} />
      <Box size={[t, h, d]} position={[w / 2, h / 2, 0]} color={color} />
      <Box size={[w, h, t]} position={[0, h / 2, -d / 2]} color={color} />
      <Box size={[side, h, t]} position={[-w / 2 + side / 2, h / 2, d / 2]} color={color} />
      <Box size={[side, h, t]} position={[w / 2 - side / 2, h / 2, d / 2]} color={color} />
      {/* Coping strip and gate */}
      <Box size={[w + 0.1, 0.1, t + 0.1]} position={[0, h, -d / 2]} color={PALETTE.trim.charcoal} />
      <Box size={[gateW, h * 0.95, 0.08]} position={[0, (h * 0.95) / 2, d / 2]} color={gateColor} metal={0.5} rough={0.45} />
      {Array.from({ length: 8 }).map((_, i) => (
        <Box key={i} size={[0.04, h * 0.9, 0.1]} position={[-gateW / 2 + (gateW / 8) * (i + 0.5), (h * 0.95) / 2, d / 2 + 0.03]} color={PALETTE.trim.charcoal} metal={0.5} />
      ))}
    </group>
  );
}

export function FlagPole({ position, color = PALETTE.brand.bgap }: { position: V3; color?: string }) {
  return (
    <group position={position}>
      <Cyl r={0.06} h={8} position={[0, 4, 0]} color={PALETTE.trim.steel} metal={0.8} rough={0.3} />
      <Box size={[1.6, 1, 0.02]} position={[0.82, 7.4, 0]} color={color} cast={false} />
      <Box size={[0.55, 1, 0.025]} position={[0.82, 7.4, 0]} color="#F3F1EC" cast={false} />
    </group>
  );
}

/** Utility pole with crossarm. */
export function UtilityPole({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <Cyl r={0.12} rTop={0.09} h={9} position={[0, 4.5, 0]} color="#7A6A55" seg={8} />
      <Box size={[1.8, 0.12, 0.12]} position={[0, 8.4, 0]} color="#5E5244" />
      <Cyl r={0.25} h={0.7} position={[0.4, 7.6, 0.2]} color="#8A939E" metal={0.5} />
    </group>
  );
}

export function Planter({ position, w = 1.6 }: { position: V3; w?: number }) {
  return (
    <group position={position}>
      <Box size={[w, 0.6, 0.7]} position={[0, 0.3, 0]} color={PALETTE.walls.concrete} />
      {Array.from({ length: 3 }).map((_, i) => (
        <mesh key={i} position={[-w / 3 + (w / 3) * i, 0.85, 0]} castShadow>
          <icosahedronGeometry args={[0.35, 0]} />
          <meshStandardMaterial color={i === 1 ? PALETTE.nature.flower : PALETTE.nature.leafLight} flatShading />
        </mesh>
      ))}
    </group>
  );
}
