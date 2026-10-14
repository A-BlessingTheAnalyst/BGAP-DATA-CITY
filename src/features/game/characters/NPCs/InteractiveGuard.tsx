"use client";

import React from 'react';
import { InteractionTrigger } from '../../physics/InteractionTrigger';

export const InteractiveGuard: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <capsuleGeometry args={[0.4, 1.0, 8, 16]} />
        <meshStandardMaterial color="#1E293B" roughness={0.3} />
      </mesh>
      <InteractionTrigger
        target={{
          id: 'npc_guard_academy',
          type: 'npc',
          label: 'Academy Security Officer',
          actionText: 'Inquire about City Permits [E]',
          position,
          radius: 2.5,
        }}
      />
    </group>
  );
};
