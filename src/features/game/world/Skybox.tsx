"use client";

import React from 'react';
import { Sky } from '@react-three/drei';

export const Skybox: React.FC = () => {
  return (
    <Sky
      distance={450000}
      sunPosition={[35, 45, 25]}
      inclination={0.4}
      azimuth={0.25}
      mieCoefficient={0.005}
      mieDirectionalG={0.8}
      rayleigh={0.6}
      turbidity={8}
    />
  );
};
