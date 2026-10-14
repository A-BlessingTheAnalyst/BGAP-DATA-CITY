"use client";

import React from 'react';
import { CapsuleCollider } from '@react-three/rapier';
import { GAME_CONFIG } from '@/shared/constants/gameConfig';

export const CharacterCollider: React.FC = () => {
  return (
    <CapsuleCollider
      args={[GAME_CONFIG.player.capsuleHeight * 0.5, GAME_CONFIG.player.capsuleRadius]}
      position={[0, GAME_CONFIG.player.capsuleHeight * 0.5, 0]}
    />
  );
};
