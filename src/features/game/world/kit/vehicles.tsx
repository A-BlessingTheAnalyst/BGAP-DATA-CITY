'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { PALETTE } from './palette';
import { Box, Cyl, Sign, V3 } from './parts';

// Vehicles of Data City. Generic designs with no real makes or badges.
// Length runs along Z (front = +Z). Ground at y = 0.

function Wheel({ position, r = 0.34, w = 0.24 }: { position: V3; r?: number; w?: number }) {
  return (
    <group position={position}>
      <Cyl r={r} h={w} rotation={[0, 0, Math.PI / 2]} color="#16181B" rough={0.9} seg={18} />
      <Cyl r={r * 0.55} h={w + 0.02} rotation={[0, 0, Math.PI / 2]} color="#A7AEB6" metal={0.8} rough={0.3} seg={12} />
    </group>
  );
}

function Lights({ w, y, zFront, zBack }: { w: number; y: number; zFront: number; zBack: number }) {
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box size={[0.32, 0.14, 0.04]} position={[s * (w / 2 - 0.25), y, zFront]} color="#FFF6D8" emissive="#FFF2C4" emissiveIntensity={0.6} cast={false} />
          <Box size={[0.3, 0.12, 0.04]} position={[s * (w / 2 - 0.22), y, zBack]} color="#B3121B" emissive="#E01E26" emissiveIntensity={0.5} cast={false} />
        </group>
      ))}
    </>
  );
}

const glassProps = { color: '#2A3B4C', rough: 0.08, metal: 0.6 };

export type CarBody = 'sedan' | 'hatchback' | 'suv' | 'taxi' | 'pickup';

/** Parametric car covering sedan, hatchback, SUV, pickup and the yellow city taxi. */
export function Car({ body = 'sedan', color = PALETTE.vehicles[0] }: { body?: CarBody; color?: string }) {
  const spec = useMemo(() => ({
    sedan: { L: 4.5, W: 1.8, H: 0.75, cabL: 2.3, cabH: 0.6, cabZ: -0.15, clr: 0.18, r: 0.33 },
    hatchback: { L: 3.9, W: 1.75, H: 0.75, cabL: 2.3, cabH: 0.62, cabZ: -0.45, clr: 0.18, r: 0.31 },
    suv: { L: 4.7, W: 1.95, H: 0.95, cabL: 3.0, cabH: 0.75, cabZ: -0.4, clr: 0.32, r: 0.4 },
    taxi: { L: 4.4, W: 1.78, H: 0.75, cabL: 2.3, cabH: 0.6, cabZ: -0.15, clr: 0.18, r: 0.33 },
    pickup: { L: 5.2, W: 1.9, H: 0.9, cabL: 1.9, cabH: 0.72, cabZ: 0.55, clr: 0.32, r: 0.4 },
  })[body], [body]);
  const paint = body === 'taxi' ? '#F2C21B' : color;
  const { L, W, H, cabL, cabH, cabZ, clr, r } = spec;
  const baseY = clr + H / 2 + 0.05;
  return (
    <group>
      <Box size={[W, H, L]} position={[0, baseY, 0]} color={paint} rough={0.35} metal={0.5} />
      {/* Cabin with glass sides */}
      <Box size={[W - 0.12, cabH, cabL]} position={[0, baseY + H / 2 + cabH / 2, cabZ]} color={paint} rough={0.35} metal={0.5} />
      <Box size={[W - 0.08, cabH * 0.75, cabL - 0.3]} position={[0, baseY + H / 2 + cabH * 0.48, cabZ]} {...glassProps} />
      <Box size={[W - 0.2, cabH * 0.8, 0.05]} position={[0, baseY + H / 2 + cabH * 0.45, cabZ + cabL / 2 + 0.01]} rotation={[-0.35, 0, 0]} {...glassProps} />
      {body === 'pickup' && (
        <group position={[0, baseY + H / 2, -1.2]}>
          <Box size={[W, 0.5, 0.08]} position={[0, 0.25, -1.3]} color={paint} metal={0.5} />
          {[-1, 1].map((s) => <Box key={s} size={[0.08, 0.5, 2.6]} position={[s * (W / 2 - 0.04), 0.25, 0]} color={paint} metal={0.5} />)}
        </group>
      )}
      {body === 'taxi' && (
        <>
          {[-1, 1].map((s) => <Box key={s} size={[0.02, 0.18, L * 0.85]} position={[s * (W / 2 + 0.01), baseY, 0]} color="#151515" cast={false} />)}
          <Sign text="TAXI" w={0.7} h={0.22} position={[0, baseY + H / 2 + cabH + 0.13, cabZ]} bg="#151515" fg="#F2C21B" lit depth={0.2} />
        </>
      )}
      <Box size={[W + 0.04, 0.14, 0.14]} position={[0, clr + 0.1, L / 2]} color="#22262B" />
      <Box size={[W + 0.04, 0.14, 0.14]} position={[0, clr + 0.1, -L / 2]} color="#22262B" />
      <Lights w={W} y={baseY + 0.1} zFront={L / 2 + 0.02} zBack={-L / 2 - 0.02} />
      {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz], i) => (
        <Wheel key={i} r={r} position={[sx * (W / 2 - 0.08), r, sz * (L / 2 - 0.8)]} />
      ))}
    </group>
  );
}

/** Yellow commuter minibus with black stripes: the backbone of city transport. */
export function Minibus({ route = 'ACADEMY — MARKET' }: { route?: string }) {
  const L = 5.2, W = 2, H = 2.1, y0 = 0.35;
  return (
    <group>
      <Box size={[W, H, L]} position={[0, y0 + H / 2, 0]} color="#F2C21B" rough={0.45} metal={0.3} />
      <Box size={[W - 0.1, 0.5, 1]} position={[0, y0 + 0.55, L / 2 + 0.3]} color="#F2C21B" rough={0.45} metal={0.3} />
      {[0.55, 1.1].map((y) => [-1, 1].map((s) => <Box key={`${y}${s}`} size={[0.02, 0.1, L]} position={[s * (W / 2 + 0.01), y0 + y, 0]} color="#151515" cast={false} />))}
      {/* Windows: front windscreen and a row of side windows */}
      <Box size={[W - 0.2, 0.8, 0.05]} position={[0, y0 + 1.55, L / 2 + 0.01]} rotation={[-0.1, 0, 0]} {...glassProps} />
      {[-1, 1].map((s) => Array.from({ length: 4 }).map((_, i) => (
        <Box key={`${s}${i}`} size={[0.03, 0.65, 0.95]} position={[s * (W / 2 + 0.01), y0 + 1.6, -1.8 + i * 1.15]} {...glassProps} />
      )))}
      {/* Open sliding door on the kerb side */}
      <Box size={[0.03, 1.6, 0.9]} position={[W / 2 + 0.01, y0 + 1, 0.8]} color="#0E0F11" cast={false} />
      <Box size={[W + 0.1, 0.12, L - 0.6]} position={[0, y0 + H + 0.06, -0.2]} color="#3A3A3A" metal={0.6} />
      <Sign text={route} w={1.6} h={0.22} position={[0, y0 + 1.97, L / 2 + 0.04]} bg="#151515" fg="#F2C21B" depth={0.04} />
      <Lights w={W} y={y0 + 0.45} zFront={L / 2 + 0.82} zBack={-L / 2 - 0.02} />
      {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz], i) => <Wheel key={i} r={0.36} position={[sx * (W / 2 - 0.1), 0.36, sz * (L / 2 - 0.8)]} />)}
    </group>
  );
}

/** Three-wheeled tricycle taxi ("keke"). */
export function Tricycle({ color = '#F2C21B' }: { color?: string }) {
  return (
    <group>
      <Box size={[1.3, 0.25, 1.6]} position={[0, 0.45, -0.3]} color="#2B2F36" metal={0.5} />
      <Box size={[1.2, 0.6, 1.2]} position={[0, 0.85, -0.4]} color={color} rough={0.5} />
      {/* Canopy frame and roof */}
      {[[-0.6, 0.55], [0.6, 0.55], [-0.6, -1], [0.6, -1]].map(([x, z], i) => <Box key={i} size={[0.05, 1.1, 0.05]} position={[x, 1.7, z]} color="#2B2F36" />)}
      <Box size={[1.35, 0.06, 1.8]} position={[0, 2.25, -0.25]} color={color} />
      <Box size={[1.1, 0.7, 0.04]} position={[0, 1.7, 0.85]} rotation={[-0.15, 0, 0]} {...glassProps} />
      <Box size={[0.6, 0.6, 0.6]} position={[0, 0.8, 0.85]} color={color} />
      <Box size={[0.6, 0.06, 0.06]} position={[0, 1.3, 0.6]} color="#111" />
      <Box size={[1.1, 0.4, 0.5]} position={[0, 1.15, -0.75]} color="#3A3A3A" />
      <Wheel position={[0, 0.27, 1.05]} r={0.27} w={0.14} />
      <Wheel position={[-0.62, 0.27, -0.75]} r={0.27} w={0.14} />
      <Wheel position={[0.62, 0.27, -0.75]} r={0.27} w={0.14} />
    </group>
  );
}

/** Commuter motorcycle, the kind used for bike taxis. */
export function Motorcycle({ color = '#C0392B' }: { color?: string }) {
  return (
    <group>
      <Wheel position={[0, 0.32, 0.65]} r={0.32} w={0.1} />
      <Wheel position={[0, 0.32, -0.65]} r={0.32} w={0.1} />
      <Box size={[0.22, 0.25, 1.1]} position={[0, 0.6, 0]} color="#2B2F36" metal={0.6} />
      <Box size={[0.3, 0.3, 0.55]} position={[0, 0.85, 0.25]} color={color} rough={0.4} metal={0.4} />
      <Box size={[0.3, 0.1, 0.75]} position={[0, 0.85, -0.35]} color="#151515" />
      <Box size={[0.05, 0.55, 0.05]} position={[0, 0.95, 0.65]} rotation={[0.35, 0, 0]} color="#888" metal={0.8} />
      <Box size={[0.7, 0.04, 0.04]} position={[0, 1.2, 0.55]} color="#222" />
      <Box size={[0.14, 0.12, 0.04]} position={[0, 1.05, 0.75]} color="#FFF6D8" emissive="#FFF2C4" emissiveIntensity={0.6} cast={false} />
    </group>
  );
}

/** Rapid-transit city bus in BGAP colours. */
export function CityBus() {
  const L = 11, W = 2.5, H = 2.9, y0 = 0.35;
  return (
    <group>
      <Box size={[W, H, L]} position={[0, y0 + H / 2, 0]} color="#1F5FA8" rough={0.4} metal={0.3} />
      <Box size={[W + 0.01, 0.4, L + 0.01]} position={[0, y0 + 0.4, 0]} color="#F3F1EC" cast={false} />
      {[-1, 1].map((s) => <Box key={s} size={[0.03, 1.1, L - 1.5]} position={[s * (W / 2 + 0.01), y0 + 1.95, -0.3]} {...glassProps} />)}
      <Box size={[W - 0.2, 1.4, 0.05]} position={[0, y0 + 1.75, L / 2 + 0.01]} {...glassProps} />
      <Sign text="BRT 12 — DATA CITY CENTRAL" w={2.2} h={0.3} position={[0, y0 + H - 0.25, L / 2 + 0.03]} bg="#111" fg="#FFB020" lit depth={0.04} />
      {[[0.9, 2.5], [0.9, -2]].map(([x, z], i) => <Box key={i} size={[0.04, 2.2, 1.3]} position={[W / 2 + 0.02, y0 + 1.2, z]} color="#2A3B4C" rough={0.2} cast={false} />)}
      <Box size={[W - 0.4, 0.3, 3]} position={[0, y0 + H + 0.15, -2]} color="#8A939E" metal={0.5} />
      <Lights w={W} y={y0 + 0.7} zFront={L / 2 + 0.02} zBack={-L / 2 - 0.02} />
      {[[-1, 3.6], [1, 3.6], [-1, -3.4], [1, -3.4]].map(([sx, z], i) => <Wheel key={i} r={0.48} w={0.32} position={[sx * (W / 2 - 0.15), 0.48, z]} />)}
    </group>
  );
}

/** Delivery van with company livery, e.g. Kora Logistics or Okeke Foods. */
export function DeliveryVan({ company = 'KORA LOGISTICS', brand = PALETTE.brand.kora }: { company?: string; brand?: string }) {
  const L = 5.4, W = 2, y0 = 0.35;
  return (
    <group>
      <Box size={[W, 2.2, 3.6]} position={[0, y0 + 1.1, -0.8]} color="#F4F4F2" rough={0.4} metal={0.2} />
      <Box size={[W, 1.5, 1.6]} position={[0, y0 + 0.75, 1.8]} color={brand} rough={0.4} metal={0.3} />
      <Box size={[W - 0.15, 0.7, 0.05]} position={[0, y0 + 1.15, 2.61]} rotation={[-0.25, 0, 0]} {...glassProps} />
      {[-1, 1].map((s) => (
        <Sign key={s} text={company} w={3} h={0.6} position={[s * (W / 2 + 0.02), y0 + 1.4, -0.8]} rotation={[0, s * Math.PI / 2, 0]} bg={brand} fg="#FFFFFF" depth={0.02} />
      ))}
      <Lights w={W} y={y0 + 0.4} zFront={L / 2 - 0.08} zBack={-2.62} />
      {[[-1, 1.8], [1, 1.8], [-1, -1.8], [1, -1.8]].map(([sx, z], i) => <Wheel key={i} r={0.36} position={[sx * (W / 2 - 0.1), 0.36, z]} />)}
    </group>
  );
}

/** Light utility helicopter (Phase F). Rotors spin whenever `flying` is true. */
export function Chopper({ color = '#E8E0D0', flying = false }: { color?: string; flying?: boolean }) {
  const main = useRef<Group>(null), tail = useRef<Group>(null);
  useFrame((_, dt) => {
    const speed = flying ? 22 : 2.5;
    if (main.current) main.current.rotation.y += dt * speed;
    if (tail.current) tail.current.rotation.x += dt * speed * 3;
  });
  return (
    <group>
      {/* Cabin */}
      <Box size={[1.9, 1.5, 2.6]} position={[0, 1.1, 0.3]} color={color} rough={0.35} metal={0.3} />
      <Box size={[1.6, 0.9, 1.6]} position={[0, 1.35, 1.1]} rotation={[0.08, 0, 0]} {...glassProps} />
      {/* Tail boom */}
      <Cyl r={0.26} h={3.4} rotation={[Math.PI / 2, 0, 0]} position={[0, 1.15, -2.6]} color={color} rough={0.4} metal={0.2} seg={12} />
      <Box size={[0.9, 1.1, 0.12]} position={[0, 1.7, -4.1]} rotation={[0.3, 0, 0]} color={color} rough={0.4} metal={0.2} />
      {/* Tail rotor */}
      <group ref={tail} position={[0.1, 1.7, -4.2]}>
        <Box size={[0.05, 0.9, 0.09]} color="#1B1C20" />
        <Box size={[0.05, 0.09, 0.9]} color="#1B1C20" />
      </group>
      {/* Skids */}
      {[-0.75, 0.75].map((x) => (
        <group key={x}>
          <Box size={[0.08, 0.08, 2.6]} position={[x, 0.35, 0.2]} color="#1B1C20" />
          <Box size={[0.08, 0.5, 0.08]} position={[x, 0.55, 1.3]} rotation={[0.3, 0, 0]} color="#1B1C20" />
          <Box size={[0.08, 0.5, 0.08]} position={[x, 0.55, -0.9]} rotation={[-0.3, 0, 0]} color="#1B1C20" />
        </group>
      ))}
      {/* Main rotor mast + blades */}
      <Cyl r={0.08} h={0.5} position={[0, 2.05, 0.3]} color="#2B2F36" metal={0.5} rough={0.3} seg={8} />
      <group ref={main} position={[0, 2.3, 0.3]}>
        <Box size={[6.6, 0.06, 0.26]} color="#1B1C20" rough={0.5} />
        <Box size={[0.26, 0.06, 6.6]} color="#1B1C20" rough={0.5} />
      </group>
    </group>
  );
}
