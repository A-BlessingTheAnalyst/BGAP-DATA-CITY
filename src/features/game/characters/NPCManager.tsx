"use client";

import React from 'react';
import { CafeOwnerNPC } from './NPCs/CafeOwnerNPC';
import { InteractiveGuard } from './NPCs/InteractiveGuard';
import { AmbientPedestrian } from './NPCs/AmbientPedestrian';

export const NPCManager: React.FC = () => {
  return (
    <group>
      {/* Chapter 1 Key Story Character */}
      <CafeOwnerNPC position={[24, 0.9, 13]} />

      {/* Academy Guard */}
      <InteractiveGuard position={[0, 0.9, -13]} />

      {/* Ambient Pedestrians */}
      <AmbientPedestrian path={[[-5, 0.9, 5], [5, 0.9, 5]]} />
      <AmbientPedestrian path={[[10, 0.9, -5], [10, 0.9, 15]]} />
    </group>
  );
};
