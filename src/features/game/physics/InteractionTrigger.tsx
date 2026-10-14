"use client";

import React from 'react';
import { useFrame } from '@react-three/fiber';
import { InteractionTarget } from '@/shared/types/game';
import { useGameState } from '../engine/GameState';
import { distance3D } from '@/shared/utils/math3d';

interface Props {
  target: InteractionTarget;
}

export const InteractionTrigger: React.FC<Props> = ({ target }) => {
  const playerPos = useGameState((s) => s.playerPosition);
  const activeTarget = useGameState((s) => s.activeTarget);
  const setActiveTarget = useGameState((s) => s.setActiveTarget);

  useFrame(() => {
    const dist = distance3D(playerPos, target.position);
    const inRange = dist <= target.radius;

    if (inRange && activeTarget?.id !== target.id) {
      setActiveTarget(target);
    } else if (!inRange && activeTarget?.id === target.id) {
      setActiveTarget(null);
    }
  });

  return null;
};
