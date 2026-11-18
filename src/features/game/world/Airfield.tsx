'use client';
import { Box, Sign } from './kit/parts';
import { MARKET_LAYOUT } from '@/shared/constants/marketLayout';

/**
 * Phase F: Data City's small Airfield, in City Gateway — a helipad and a control hut. No runway or
 * fixed-wing plane this pass (only the chopper's hover model is built; see masterprompt.md), so the
 * pad is sized for vertical landing, not a landing strip.
 */
export function Airfield() {
  const [x, , z] = MARKET_LAYOUT.airfield;
  return (
    <group position={[x, 0, z]}>
      {/* Helipad: a circular concrete pad with a painted H. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
        <circleGeometry args={[7, 32]} />
        <meshStandardMaterial color="#5B6169" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[6.3, 6.8, 32]} />
        <meshStandardMaterial color="#F2B134" roughness={0.6} />
      </mesh>
      <Box size={[0.5, 0.02, 3]} position={[0, 0.045, 0]} color="#F3F1EC" />
      <Box size={[3, 0.02, 0.5]} position={[0, 0.045, 0]} color="#F3F1EC" />

      {/* Control hut + small hangar, set back from the pad. */}
      <group position={[-11, 0, -4]}>
        <Box size={[7, 3.2, 6]} position={[0, 1.6, 0]} color="#DCD6C8" rough={0.8} />
        <Box size={[7.2, 0.3, 6.2]} position={[0, 3.3, 0]} color="#8A6B4A" rough={0.7} />
        <Box size={[2.2, 1.6, 0.05]} position={[0, 2, 3.03]} color="#2A3B4C" rough={0.1} metal={0.4} />
        <Sign text="DATA CITY AIRFIELD" sub="Flight school • Charter • Fuel" w={5} h={1.1} position={[0, 3.9, 3.05]} bg="#1F3A6B" fg="#F2B134" lit />
      </group>
      {/* Windsock */}
      <Box size={[0.08, 4.5, 0.08]} position={[8.5, 2.25, -6]} color="#8A939E" />
      <Box size={[1.2, 0.35, 0.35]} position={[9.2, 4, -6]} rotation={[0, 0, -0.15]} color="#D4452B" />
    </group>
  );
}
