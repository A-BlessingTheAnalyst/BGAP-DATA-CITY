"use client";

import React from 'react';
import { RigidBody } from '@react-three/rapier';

interface Props {
  position: [number, number, number];
}

export const AcademyBuilding: React.FC<Props> = ({ position }) => {
  return (
    <group position={position}>
      <RigidBody type="fixed">
        {/* Main Headquarters Tower */}
        <mesh position={[0, 12, 0]} castShadow receiveShadow>
          <boxGeometry args={[30, 24, 20]} />
          <meshStandardMaterial color="#111827" metalness={0.7} roughness={0.2} />
        </mesh>
      </RigidBody>

      {/* Architectural Glass Facade Accent */}
      <mesh position={[0, 12, 10.1]}>
        <planeGeometry args={[26, 20]} />
        <meshStandardMaterial
          color="#00F2FE"
          emissive="#004D7A"
          emissiveIntensity={0.6}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Canopy */}
      <mesh position={[0, 3.5, 12]}>
        <boxGeometry args={[10, 0.4, 4]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
    </group>
  );
};
