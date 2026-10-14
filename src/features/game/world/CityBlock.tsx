"use client";

import React from 'react';
import { RigidBody } from '@react-three/rapier';

export const CityBlock: React.FC = () => {
  return (
    <group>
      {/* Ground / Asphalt Plane */}
      <RigidBody type="fixed" friction={1}>
        <mesh receiveShadow position={[0, -0.05, 0]}>
          <boxGeometry args={[120, 0.1, 120]} />
          <meshStandardMaterial color="#0E131F" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* Road Markings / Cyan Neon Guideway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[12, 100]} />
        <meshBasicMaterial color="#0F172A" />
      </mesh>

      {/* Neon Street Accent Lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[0.3, 100]} />
        <meshBasicMaterial color="#00F2FE" />
      </mesh>

      {/* Sidewalk curbs */}
      <RigidBody type="fixed">
        <mesh receiveShadow position={[7, 0.1, 0]}>
          <boxGeometry args={[2, 0.2, 100]} />
          <meshStandardMaterial color="#1E293B" roughness={0.6} />
        </mesh>
        <mesh receiveShadow position={[-7, 0.1, 0]}>
          <boxGeometry args={[2, 0.2, 100]} />
          <meshStandardMaterial color="#1E293B" roughness={0.6} />
        </mesh>
      </RigidBody>
    </group>
  );
};
