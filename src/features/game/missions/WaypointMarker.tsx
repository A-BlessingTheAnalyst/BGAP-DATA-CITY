"use client";

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface Props {
  position: [number, number, number];
  label: string;
}

export const WaypointMarker: React.FC<Props> = ({ position, label }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = clock.getElapsedTime() * 1.5;
    meshRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 3) * 0.25;
  });

  return (
    <group position={position}>
      {/* 3D Spinning Diamond Beacon */}
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial
          color="#00F2FE"
          emissive="#00F2FE"
          emissiveIntensity={1.8}
          wireframe={false}
        />
      </mesh>

      {/* Vertical Light Pillar */}
      <mesh position={[0, -2, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 4, 8]} />
        <meshBasicMaterial color="#00F2FE" transparent opacity={0.4} />
      </mesh>

      {/* HTML Floating Beacon Label */}
      <Html position={[0, 1.2, 0]} center distanceFactor={15}>
        <div className="bg-bgap-surface/90 border border-bgap-cyan text-bgap-cyan px-2.5 py-1 rounded-full text-xs font-mono whitespace-nowrap shadow-neon-cyan flex items-center gap-1.5 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-bgap-cyan animate-ping" />
          <span>{label}</span>
        </div>
      </Html>
    </group>
  );
};
