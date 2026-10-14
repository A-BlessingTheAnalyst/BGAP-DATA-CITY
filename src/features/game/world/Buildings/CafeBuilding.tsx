'use client';

import React from 'react';
import { RigidBody } from '@react-three/rapier';
import { WorkstationDesk } from './WorkstationDesk';

interface Props {
  position: [number, number, number];
}

export const CafeBuilding: React.FC<Props> = ({ position }) => {
  return (
    <group position={position}>
      {/* 1. Main Café Bistro Building Structure */}
      <RigidBody type="fixed">
        <mesh position={[0, 5, 0]} castShadow receiveShadow userData={{ cameraBlocker: true }}>
          <boxGeometry args={[22, 10, 16]} />
          <meshStandardMaterial color="#451A03" roughness={0.6} />
        </mesh>
      </RigidBody>

      {/* Rich Teak Wood Siding Facade Trim */}
      <mesh position={[0, 5, 8.05]}>
        <boxGeometry args={[22.2, 10.2, 0.2]} />
        <meshStandardMaterial color="#78350F" roughness={0.5} />
      </mesh>

      {/* 2. Warm Glowing Bistro Windows */}
      <mesh position={[0, 4.5, 8.2]}>
        <planeGeometry args={[18, 5.5]} />
        <meshStandardMaterial
          color="#FEF08A"
          emissive="#F59E0B"
          emissiveIntensity={2.0}
          roughness={0.2}
        />
      </mesh>

      {/* Window Frames */}
      {[-6, 0, 6].map((wx) => (
        <mesh key={'wframe-' + wx} position={[wx, 4.5, 8.25]}>
          <boxGeometry args={[0.3, 5.5, 0.1]} />
          <meshBasicMaterial color="#1E293B" />
        </mesh>
      ))}

      {/* 3. Red & Gold Striped Parisian Patio Awning */}
      <mesh position={[0, 6.2, 10.8]} rotation={[0.22, 0, 0]} castShadow>
        <boxGeometry args={[20, 0.2, 6.5]} />
        <meshStandardMaterial color="#DC2626" roughness={0.5} />
      </mesh>

      {/* 4. Glowing Neon Cursive Sign: MAMA BISI'S GOURMET CAFÉ */}
      <mesh position={[0, 8.2, 8.35]}>
        <boxGeometry args={[16, 1.8, 0.3]} />
        <meshStandardMaterial
          color="#F59E0B"
          emissive="#D97706"
          emissiveIntensity={3.2}
          roughness={0.1}
        />
      </mesh>

      {/* 5. Outdoor Teak Wood Patio Dining Deck */}
      <RigidBody type="fixed">
        <mesh position={[0, 0.12, 12.5]} receiveShadow>
          <boxGeometry args={[21, 0.24, 9.0]} />
          <meshStandardMaterial color="#92400E" roughness={0.6} />
        </mesh>
      </RigidBody>

      {/* Patio Parasols & Bistro Dining Tables */}
      {[-6, 6].map((tx) => (
        <group key={'patio-table-' + tx} position={[tx, 0.24, 12]}>
          {/* Table */}
          <mesh position={[0, 0.75, 0]} castShadow>
            <cylinderGeometry args={[0.95, 0.95, 0.08, 16]} />
            <meshStandardMaterial color="#E5E7EB" roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0.375, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.75, 8]} />
            <meshStandardMaterial color="#1F2937" metalness={0.9} />
          </mesh>
          {/* Parasol Umbrella */}
          <mesh position={[0, 2.3, 0]} castShadow>
            <coneGeometry args={[1.6, 0.65, 8]} />
            <meshStandardMaterial color="#DC2626" roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.45, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 1.7, 8]} />
            <meshStandardMaterial color="#F3F4F6" metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Investigation Analytics Laptop Workstation on Patio */}
      <WorkstationDesk position={[0, 0.24, 14.5]} workstationId="ws_cafe_laptop" />
    </group>
  );
};
