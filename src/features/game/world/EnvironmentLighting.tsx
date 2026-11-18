"use client";

import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { DirectionalLight, Vector3 } from 'three';
import { playerRuntime } from '../characters/PlayerCharacter';
import { useGameState } from '../engine/GameState';
import { GAME_CONFIG } from '@/shared/constants/gameConfig';
import { SUN_POSITION } from './Skybox';

// Warm afternoon key light matched to the sky's sun, a soft sky/ground fill,
// and a cool bounce so shadows don't go muddy. Ambient detail comes from the HDRI.
// The sun's shadow box (160 m) follows the player, so shadows work anywhere in the city.
const SUN_DIR = new Vector3(...SUN_POSITION).normalize();
const SHADOW_HALF = 80;

export const EnvironmentLighting: React.FC = () => {
  const sun = useRef<DirectionalLight>(null);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const l = sun.current;
    if (!l) return;
    scene.add(l.target);
    return () => { scene.remove(l.target); };
  }, [scene]);
  useFrame(() => {
    const l = sun.current;
    if (!l) return;
    // Snap to whole shadow texels so edges don't shimmer as you walk.
    const texel = (SHADOW_HALF * 2) / l.shadow.mapSize.width;
    const x = Math.round(playerRuntime.position.x / texel) * texel, z = Math.round(playerRuntime.position.z / texel) * texel;
    l.target.position.set(x, 0, z);
    l.position.set(x + SUN_DIR.x * 110, SUN_DIR.y * 110, z + SUN_DIR.z * 110);
  });
  const quality = useGameState((s) => s.graphicsQuality);
  const enableShadows = GAME_CONFIG.graphics[quality].shadows;
  const size = quality === 'high' ? 4096 : 2048;

  return (
    <>
      <hemisphereLight args={['#FFF1D9', '#7A5E45', 0.55]} />
      <directionalLight
        ref={sun}
        position={SUN_POSITION}
        intensity={2.6}
        color="#FFE1B5"
        castShadow={enableShadows}
        shadow-mapSize-width={size}
        shadow-mapSize-height={size}
        shadow-camera-far={220}
        shadow-camera-left={-SHADOW_HALF}
        shadow-camera-right={SHADOW_HALF}
        shadow-camera-top={SHADOW_HALF}
        shadow-camera-bottom={-SHADOW_HALF}
        shadow-bias={-0.0003}
        shadow-normalBias={0.04}
      />
      <directionalLight position={[-40, 25, -30]} intensity={0.35} color="#BFD6EA" />
    </>
  );
};
