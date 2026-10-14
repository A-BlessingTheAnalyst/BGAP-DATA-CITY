"use client";

import React from 'react';
import { Sky } from '@react-three/drei';

export const Skybox: React.FC = () => {
  return (
    <>
      {/* Cinematic Deep Navy/Slate Cyber Dusk Background & Fog */}
      <color attach="background" args={['#0B1120']} />
      <fog attach="fog" args={['#0B1120', 25, 260]} />

      {/* Atmospheric Sky Dome within camera frustum */}
      <Sky
        distance={240}
        sunPosition={[45, 55, 35]}
        inclination={0.45}
        azimuth={0.25}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
        rayleigh={0.8}
        turbidity={6}
      />
    </>
  );
};
