'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { Mesh } from 'three';

interface Props {
  position: [number, number, number];
}

export const AcademyBuilding: React.FC<Props> = ({ position }) => {
  const emblemRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (emblemRef.current) {
      emblemRef.current.rotation.z += delta * 0.5;
    }
  });

  return (
    <group position={position}>
      {/* 1. Main Architectural Campus Wing */}
      <RigidBody type="fixed">
        <mesh position={[0, 10, 0]} castShadow receiveShadow userData={{ cameraBlocker: true }}>
          <boxGeometry args={[36, 20, 22]} />
          <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.7} />
        </mesh>
      </RigidBody>

      {/* White Architectural Framing Trim */}
      <mesh position={[0, 10, 11.05]}>
        <boxGeometry args={[36.4, 20.4, 0.4]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.2} metalness={0.3} />
      </mesh>

      {/* 2. Grand Illuminated Glass Curtain Wall (Facing the Plaza) */}
      <mesh position={[0, 10, 11.3]}>
        <planeGeometry args={[30, 16]} />
        <meshStandardMaterial
          color="#38BDF8"
          emissive="#0284C7"
          emissiveIntensity={1.8}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Window Mullion Grid Lines */}
      {[-10, -5, 0, 5, 10].map((mx) => (
        <mesh key={'mull-v-' + mx} position={[mx, 10, 11.35]}>
          <boxGeometry args={[0.2, 16, 0.1]} />
          <meshBasicMaterial color="#0F172A" />
        </mesh>
      ))}
      {[5, 10, 15].map((my) => (
        <mesh key={'mull-h-' + my} position={[0, my, 11.35]}>
          <boxGeometry args={[30, 0.2, 0.1]} />
          <meshBasicMaterial color="#0F172A" />
        </mesh>
      ))}

      {/* 3. Grand Entrance Colonnade Pillars (Bright White Granite) */}
      {[-14, -7, 0, 7, 14].map((px) => (
        <mesh key={'col-' + px} position={[px, 4.5, 13.5]} castShadow>
          <cylinderGeometry args={[0.5, 0.5, 9, 16]} />
          <meshStandardMaterial color="#F1F5F9" roughness={0.2} metalness={0.2} />
        </mesh>
      ))}

      {/* Grand Entrance Canopy */}
      <mesh position={[0, 9.2, 14.5]} castShadow>
        <boxGeometry args={[32, 0.6, 5]} />
        <meshStandardMaterial color="#0F172A" metalness={0.8} />
      </mesh>

      {/* Entrance Terrace Stairs */}
      {[0, 1, 2, 3].map((step) => (
        <mesh key={'step-' + step} position={[0, step * 0.2, 14.2 + step * 0.8]} receiveShadow>
          <boxGeometry args={[30 - step * 1.5, 0.2, 1.0]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.4} />
        </mesh>
      ))}

      {/* 4. Giant Holographic Sign: BGAP DATA ACADEMY */}
      <mesh position={[0, 19.5, 11.5]}>
        <boxGeometry args={[22, 2.2, 0.4]} />
        <meshStandardMaterial
          color="#00F2FE"
          emissive="#00F2FE"
          emissiveIntensity={3.0}
          roughness={0.1}
        />
      </mesh>

      {/* Rotating Holographic Academy Emblem */}
      <mesh ref={emblemRef} position={[0, 23.5, 11.4]}>
        <ringGeometry args={[1.2, 1.8, 6]} />
        <meshBasicMaterial color="#00F2FE" />
      </mesh>
    </group>
  );
};
