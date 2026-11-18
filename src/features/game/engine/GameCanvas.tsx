"use client";

import React, { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor, useDetectGPU } from '@react-three/drei';
import { SceneManager } from './SceneManager';
import { PostFX } from './PostFX';
import { useGameState } from './GameState';
import { GAME_CONFIG } from '@/shared/constants/gameConfig';
import type { GraphicsQuality } from '@/shared/types/game';

const TIERS: GraphicsQuality[] = ['low', 'balanced', 'high'];

/** Picks a starting tier from the GPU benchmark database (drei useDetectGPU). */
function InitialQuality() {
  const gpu = useDetectGPU();
  const setQuality = useGameState((s) => s.setGraphicsQuality);
  useEffect(() => {
    if (!gpu) return;
    setQuality(gpu.isMobile || gpu.tier <= 1 ? 'low' : gpu.tier === 2 ? 'balanced' : 'high');
  }, [gpu, setQuality]);
  return null;
}

export const GameCanvas: React.FC = () => {
  const quality = useGameState((s) => s.graphicsQuality);
  const setQuality = useGameState((s) => s.setGraphicsQuality);
  const config = GAME_CONFIG.graphics[quality];
  const step = (dir: 1 | -1) => {
    const i = TIERS.indexOf(useGameState.getState().graphicsQuality);
    const next = TIERS[Math.max(0, Math.min(TIERS.length - 1, i + dir))];
    if (next !== TIERS[i]) setQuality(next);
  };

  return (
    <div className="relative w-full h-full select-none bg-bgap-dark overflow-hidden">
      <Canvas
        shadows={config.shadows}
        dpr={[1, config.pixelRatio]}
        camera={{ position: [0, 3, -5], fov: GAME_CONFIG.camera.fov, near: 0.1, far: 650 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={(state) => {
          // Dev-only handle for debugging the scene from the browser console.
          if (process.env.NODE_ENV !== 'production') (window as unknown as { __dataCity?: unknown }).__dataCity = state;
        }}
      >
        <Suspense fallback={null}>
          <InitialQuality />
        </Suspense>
        {/* Drops a tier when frame rate sags, climbs back when there is headroom. */}
        <PerformanceMonitor onDecline={() => step(-1)} onIncline={() => step(1)} flipflops={3} onFallback={() => setQuality('low')} />
        <AdaptiveDpr pixelated />
        <Suspense fallback={null}>
          <SceneManager />
          <PostFX quality={quality} />
        </Suspense>
      </Canvas>
    </div>
  );
};
