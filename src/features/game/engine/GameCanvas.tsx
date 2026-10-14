"use client";

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { SceneManager } from './SceneManager';
import { useGameState } from './GameState';
import { GAME_CONFIG } from '@/shared/constants/gameConfig';

export const GameCanvas: React.FC = () => {
  const quality = useGameState((s) => s.graphicsQuality);
  const config = GAME_CONFIG.graphics[quality];

  return (
    <div className="relative w-full h-full select-none bg-bgap-dark overflow-hidden">
      <Canvas
        shadows={config.shadows}
        dpr={config.pixelRatio}
        camera={{ position: [0, 3, -5], fov: GAME_CONFIG.camera.fov, near: 0.1, far: 350 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <SceneManager />
        </Suspense>
      </Canvas>
    </div>
  );
};
