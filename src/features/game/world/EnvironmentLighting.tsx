"use client";

import React from 'react';
import { useGameState } from '../engine/GameState';
import { GAME_CONFIG } from '@/shared/constants/gameConfig';

export const EnvironmentLighting: React.FC = () => {
  const quality = useGameState((s) => s.graphicsQuality);
  const enableShadows = GAME_CONFIG.graphics[quality].shadows;

  return (
    <>
      {/* Ambient Lighting */}
      <ambientLight intensity={0.45} color="#C8D6E5" />

      {/* Main Warm Sunlight */}
      <directionalLight
        position={[35, 45, 25]}
        intensity={1.2}
        color="#FFF6E5"
        castShadow={enableShadows}
        shadow-mapSize-width={enableShadows ? 2048 : 512}
        shadow-mapSize-height={enableShadows ? 2048 : 512}
        shadow-camera-far={120}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-bias={-0.0001}
      />

      {/* Soft Blue Skylight fill */}
      <directionalLight position={[-20, 20, -20]} intensity={0.3} color="#4FACFE" />
    </>
  );
};
