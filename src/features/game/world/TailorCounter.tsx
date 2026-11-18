'use client';
import { useMemo } from 'react';
import { InteractionTrigger } from '../physics/InteractionTrigger';
import { Box, Sign } from './kit/parts';
import { CastMember } from './kit/CastMember';
import { cadetDef, useWardrobe } from '../ui/wardrobe/useWardrobe';
import { MARKET_LAYOUT } from '@/shared/constants/marketLayout';

const FABRIC_ROLLS = ['#C4302B', '#1F5FA8', '#F2B134', '#2F8F5B', '#2D3A6B', '#C9A13B'];
const TARGET = { id: 'shop:tailor', type: 'shop' as const, label: 'Zee Fabrics Tailoring', actionText: 'Browse Zee Fabrics Tailoring [E]', position: MARKET_LAYOUT.tailor, radius: 2.4 };

/**
 * The tailor's pavement stall beside Zee Fabrics: a cutting table with fabric rolls, a sign and a
 * mannequin in the shop's indigo kaftan. E opens the try-on mirror and the catalog.
 */
export function TailorCounter() {
  const byId = useWardrobe((s) => s.byId);
  const mannequin = useMemo(
    () => (byId.size ? cadetDef({ body: 'male', skin: 6, skinTone: 1.15, hair: 'none', hairColor: '#1E1714' }, { dress: 'kaftan_indigo', shoes: 'sandals_brown', head: 'kufi_white' }, byId, 'Mannequin') : null),
    [byId],
  );
  const [x, , z] = MARKET_LAYOUT.tailor;
  return (
    // The stall faces the boulevard (+X).
    <group position={[x, 0, z]} rotation={[0, Math.PI / 2, 0]}>
      {/* Cutting table */}
      <Box size={[1.8, 0.06, 0.8]} position={[0, 0.88, -0.6]} color="#7A5A3A" />
      {[[-0.82, -0.95], [0.82, -0.95], [-0.82, -0.25], [0.82, -0.25]].map(([px, pz], i) => <Box key={i} size={[0.06, 0.88, 0.06]} position={[px, 0.44, pz]} color="#3B2A1C" />)}
      {FABRIC_ROLLS.map((c, i) => (
        <mesh key={c} position={[-0.7 + i * 0.28, 1.0, -0.6]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.7, 12]} />
          <meshStandardMaterial color={c} roughness={0.9} />
        </mesh>
      ))}
      {/* Sign on two poles */}
      <Box size={[0.06, 2.6, 0.06]} position={[-1.0, 1.3, -1.05]} color="#2B2F36" />
      <Box size={[0.06, 2.6, 0.06]} position={[1.0, 1.3, -1.05]} color="#2B2F36" />
      <Sign text="ZEE TAILORING" sub="Ankara • Suits • Aso-oke • Try on & buy" w={2.2} h={0.55} position={[0, 2.35, -1.02]} bg="#6A3D9A" fg="#F2B134" lit />
      {/* Mannequin on a stand */}
      {mannequin && (
        <group position={[1.35, 0.06, -0.55]} rotation={[0, -0.5, 0]}>
          <Box size={[0.5, 0.06, 0.5]} position={[0, -0.03, 0]} color="#2B2F36" />
          <CastMember def={mannequin} action="Idle" />
        </group>
      )}
      <InteractionTrigger target={TARGET} />
    </group>
  );
}
