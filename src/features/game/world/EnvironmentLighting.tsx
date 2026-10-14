"use client";

import React from 'react';
import { useGameState } from '../engine/GameState';
import { GAME_CONFIG } from '@/shared/constants/gameConfig';

export const EnvironmentLighting: React.FC = () => {
  const quality = useGameState((s) => s.graphicsQuality);
  const enableShadows = GAME_CONFIG.graphics[quality].shadows;

  return (
    <>
      {/* Rich Sky & Ground Ambient Hemispherical Fill */}
      <hemisphereLight args={['#C7D2FE', '#1E293B', 1.0]} />

      {/* Warm Main Key Sunlight */}
      <directionalLight
        position={[45, 55, 35]}
        intensity={2.4}
        color="#FFFBF0"
        castShadow={enableShadows}
        shadow-mapSize-width={enableShadows ? 2048 : 512}
        shadow-mapSize-height={enableShadows ? 2048 : 512}
        shadow-camera-far={150}
        shadow-camera-left={-65}
        shadow-camera-right={65}
        shadow-camera-top={65}
        shadow-camera-bottom={-65}
        shadow-bias={-0.0001}
      />

      {/* Cyber Blue Skylight Fill */}
      <directionalLight position={[-35, 30, -35]} intensity={0.8} color="#38BDF8" />

      {/* Golden Sunset Rim Light */}
      <directionalLight position={[0, 20, -50]} intensity={0.7} color="#FBBF24" />
    </>
  );
};
