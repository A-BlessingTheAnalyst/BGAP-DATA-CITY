"use client";

import React from 'react';
import { InteractionTrigger } from '../../physics/InteractionTrigger';

interface Props {
  position: [number, number, number];
}

export const CafeOwnerNPC: React.FC<Props> = ({ position }) => {
  return (
    <group position={position}>
      {/* Stylized Mama Bisi character mesh */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.38, 0.9, 8, 16]} />
        <meshStandardMaterial color="#F59E0B" roughness={0.5} />
      </mesh>
      {/* Apron */}
      <mesh position={[0, 0.7, 0.25]}>
        <boxGeometry args={[0.5, 0.6, 0.2]} />
        <meshStandardMaterial color="#DC2626" />
      </mesh>

      <InteractionTrigger
        target={{
          id: 'npc_mama_bisi',
          type: 'npc',
          label: 'Mama Bisi',
          actionText: 'Speak with Café Owner [E]',
          position,
          radius: 2.8,
        }}
      />
    </group>
  );
};
