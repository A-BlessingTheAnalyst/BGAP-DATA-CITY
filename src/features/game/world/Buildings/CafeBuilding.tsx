"use client";

import React from 'react';
import { RigidBody } from '@react-three/rapier';
import { WorkstationDesk } from './WorkstationDesk';

interface Props {
  position: [number, number, number];
}

export const CafeBuilding: React.FC<Props> = ({ position }) => {
  return (
    <group position={position}>
      {/* Exterior Architecture */}
      <RigidBody type="fixed">
        <mesh position={[0, 4.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[18, 9, 14]} />
          <meshStandardMaterial color="#1E293B" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Neon Signboard */}
      <mesh position={[0, 7.5, 7.1]}>
        <boxGeometry args={[12, 1.8, 0.2]} />
        <meshStandardMaterial
          color="#F59E0B"
          emissive="#D97706"
          emissiveIntensity={1.2}
          roughness={0.2}
        />
      </mesh>

      {/* Outdoor Patio Dining / Investigation Laptop Workstation */}
      <WorkstationDesk position={[3, 0, 8.5]} workstationId="ws_cafe_laptop" />
    </group>
  );
};
