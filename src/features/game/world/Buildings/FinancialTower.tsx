'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { Mesh } from 'three';

interface Props {
  position: [number, number, number];
}

export const FinancialTower: React.FC<Props> = ({ position }) => {
  const tickerRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (tickerRef.current) {
      tickerRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group position={position}>
      {/* Skyscraper Base Podium */}
      <RigidBody type="fixed">
        <mesh position={[0, 6, 0]} castShadow receiveShadow userData={{ cameraBlocker: true }}>
          <boxGeometry args={[26, 12, 26]} />
          <meshStandardMaterial color="#0A0E17" roughness={0.3} metalness={0.85} />
        </mesh>
      </RigidBody>

      {/* Main Glass Office High-Rise Spire */}
      <RigidBody type="fixed">
        <mesh position={[0, 28, 0]} castShadow receiveShadow userData={{ cameraBlocker: true }}>
          <boxGeometry args={[20, 32, 20]} />
          <meshStandardMaterial
            color="#1E3A8A"
            emissive="#0F172A"
            roughness={0.15}
            metalness={0.95}
          />
        </mesh>
      </RigidBody>

      {/* Spire Peak */}
      <mesh position={[0, 48, 0]}>
        <coneGeometry args={[9, 8, 4]} />
        <meshStandardMaterial color="#00F2FE" emissive="#0284C7" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Rooftop Helipad */}
      <mesh position={[0, 44.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5, 7, 32]} />
        <meshBasicMaterial color="#F59E0B" />
      </mesh>

      {/* Dynamic 360-degree Financial Ticker Tape Ribbon */}
      <mesh ref={tickerRef} position={[0, 12.2, 0]}>
        <cylinderGeometry args={[13.3, 13.3, 1.2, 32, 1, true]} />
        <meshStandardMaterial
          color="#10B981"
          emissive="#10B981"
          emissiveIntensity={2.0}
          roughness={0.2}
          side={2}
        />
      </mesh>

      {/* Grand Entrance Glass Canopy */}
      <mesh position={[0, 4.2, 14]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[14, 0.3, 6]} />
        <meshStandardMaterial color="#00F2FE" transparent opacity={0.5} roughness={0.1} />
      </mesh>

      {/* Entrance Columns */}
      {[-5, 5].map((cx) => (
        <mesh key={cx} position={[cx, 2, 16]}>
          <cylinderGeometry args={[0.3, 0.3, 4]} />
          <meshStandardMaterial color="#64748B" metalness={0.8} />
        </mesh>
      ))}

      {/* Neon Tower Sign: MERIDIAN CAPITAL */}
      <mesh position={[0, 9.5, 13.1]}>
        <boxGeometry args={[18, 1.6, 0.2]} />
        <meshStandardMaterial
          color="#F59E0B"
          emissive="#D97706"
          emissiveIntensity={1.8}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
};
