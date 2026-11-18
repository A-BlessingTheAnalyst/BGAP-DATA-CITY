"use client";

import React from 'react';
import { Environment, Sky } from '@react-three/drei';

// Warm, hazy Lagos afternoon. The sky dome is drawn by drei <Sky>; image-based
// lighting comes from a 1k CC0 Poly Haven HDRI (lighting only, not the backdrop).
export const SUN_POSITION: [number, number, number] = [60, 28, 40];

export const Skybox: React.FC = () => {
  return (
    <>
      <color attach="background" args={['#E9D7B8']} />
      <fog attach="fog" args={['#E6D3B3', 110, 520]} />
      <Sky sunPosition={SUN_POSITION} turbidity={7} rayleigh={1.6} mieCoefficient={0.008} mieDirectionalG={0.85} distance={4000} />
      <Environment files="/assets/hdri/partly_cloudy_1k.hdr" environmentIntensity={0.55} />
    </>
  );
};
