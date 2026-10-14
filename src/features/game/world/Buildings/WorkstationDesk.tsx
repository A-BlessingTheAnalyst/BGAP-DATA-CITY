"use client";

import React from 'react';
import { InteractionTrigger } from '../../physics/InteractionTrigger';

interface Props {
  position: [number, number, number];
  workstationId: string;
}

export const WorkstationDesk: React.FC<Props> = ({ position, workstationId }) => {
  return (
    <group position={position}>
      {/* Table Top */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[1.8, 0.08, 0.9]} />
        <meshStandardMaterial color="#334155" roughness={0.4} />
      </mesh>

      {/* Table Legs */}
      <mesh position={[-0.8, 0.375, -0.35]}>
        <cylinderGeometry args={[0.03, 0.03, 0.75]} />
        <meshStandardMaterial color="#0F172A" metalness={0.8} />
      </mesh>
      <mesh position={[0.8, 0.375, -0.35]}>
        <cylinderGeometry args={[0.03, 0.03, 0.75]} />
        <meshStandardMaterial color="#0F172A" metalness={0.8} />
      </mesh>
      <mesh position={[-0.8, 0.375, 0.35]}>
        <cylinderGeometry args={[0.03, 0.03, 0.75]} />
        <meshStandardMaterial color="#0F172A" metalness={0.8} />
      </mesh>
      <mesh position={[0.8, 0.375, 0.35]}>
        <cylinderGeometry args={[0.03, 0.03, 0.75]} />
        <meshStandardMaterial color="#0F172A" metalness={0.8} />
      </mesh>

      {/* Analytics Laptop Terminal */}
      <mesh position={[0, 0.81, 0]}>
        <boxGeometry args={[0.42, 0.02, 0.28]} />
        <meshStandardMaterial color="#64748B" metalness={0.9} />
      </mesh>
      {/* Laptop Screen (Glows Cyan) */}
      <mesh position={[0, 0.95, -0.13]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.42, 0.26, 0.02]} />
        <meshStandardMaterial
          color="#00F2FE"
          emissive="#00F2FE"
          emissiveIntensity={1.5}
          roughness={0.2}
        />
      </mesh>

      {/* Proximity Interaction Trigger */}
      <InteractionTrigger
        target={{
          id: workstationId,
          type: 'workstation',
          label: 'Analytics Terminal',
          actionText: 'Investigate Transaction Data [E]',
          position,
          radius: 2.2,
        }}
      />
    </group>
  );
};
