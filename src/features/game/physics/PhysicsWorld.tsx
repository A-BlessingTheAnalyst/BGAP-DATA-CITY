"use client";

import React from 'react';
import { Physics } from '@react-three/rapier';
import { GAME_CONFIG } from '@/shared/constants/gameConfig';

interface Props {
  children: React.ReactNode;
}

export const PhysicsWorld: React.FC<Props> = ({ children }) => {
  const debug = process.env.NEXT_PUBLIC_ENABLE_PHYSICS_DEBUG === 'true';

  return (
    <Physics gravity={GAME_CONFIG.physics.gravity} timeStep={GAME_CONFIG.physics.timeStep} debug={debug}>
      {children}
    </Physics>
  );
};
