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
      {/* Back Wall */}
      <RigidBody type="fixed">
        <mesh position={[0, 4.5, -6]} castShadow receiveShadow userData={{ cameraBlocker: true }}>
          <boxGeometry args={[18, 9, 1]} />
          <meshStandardMaterial color="#1E293B" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Left Wall */}
      <RigidBody type="fixed">
        <mesh position={[-8.5, 4.5, 0]} castShadow receiveShadow userData={{ cameraBlocker: true }}>
          <boxGeometry args={[1, 9, 12]} />
          <meshStandardMaterial color="#1E293B" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Right Wall */}
      <RigidBody type="fixed">
        <mesh position={[8.5, 4.5, 0]} castShadow receiveShadow userData={{ cameraBlocker: true }}>
          <boxGeometry args={[1, 9, 12]} />
          <meshStandardMaterial color="#1E293B" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Front Entrance Wall Left Wing */}
      <RigidBody type="fixed">
        <mesh position={[-5.5, 4.5, 6]} castShadow receiveShadow userData={{ cameraBlocker: true }}>
          <boxGeometry args={[5, 9, 0.8]} />
          <meshStandardMaterial color="#1E293B" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Front Entrance Wall Right Wing */}
      <RigidBody type="fixed">
        <mesh position={[5.5, 4.5, 6]} castShadow receiveShadow userData={{ cameraBlocker: true }}>
          <boxGeometry args={[5, 9, 0.8]} />
          <meshStandardMaterial color="#1E293B" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Glass Frontage Above Open Walkway */}
      <mesh position={[0, 7.5, 6]}>
        <boxGeometry args={[6, 3, 0.2]} />
        <meshStandardMaterial color="#00F2FE" transparent opacity={0.3} roughness={0.1} />
      </mesh>

      {/* Roof Canopy */}
      <mesh position={[0, 9.2, 0]} castShadow receiveShadow userData={{ cameraBlocker: true }}>
        <boxGeometry args={[19, 0.6, 15]} />
        <meshStandardMaterial color="#0F172A" roughness={0.9} />
      </mesh>

      {/* Warm Front Patio Awning (Red & Gold Stripes Vibe) */}
      <mesh position={[0, 5.2, 8.5]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[16, 0.15, 4.5]} />
        <meshStandardMaterial color="#DC2626" roughness={0.6} />
      </mesh>

      {/* Glowing Neon Sign */}
      <mesh position={[0, 6.8, 6.2]}>
        <boxGeometry args={[11, 1.4, 0.2]} />
        <meshStandardMaterial
          color="#F59E0B"
          emissive="#D97706"
          emissiveIntensity={1.4}
          roughness={0.2}
        />
      </mesh>

      {/* Outdoor Patio Dining / Investigation Laptop Workstation */}
      <WorkstationDesk position={[3, 0, 8.5]} workstationId="ws_cafe_laptop" />
    </group>
  );
};
