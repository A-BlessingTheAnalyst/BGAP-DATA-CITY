"use client";

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  path: [number, number, number][];
}

export const AmbientPedestrian: React.FC<Props> = ({ path }) => {
  const meshRef = useRef<THREE.Group>(null);
  const targetIdx = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current || path.length < 2) return;
    const current = meshRef.current.position;
    const target = path[targetIdx.current];

    const targetVec = new THREE.Vector3(target[0], target[1], target[2]);
    const dist = current.distanceTo(targetVec);

    if (dist < 0.2) {
      targetIdx.current = (targetIdx.current + 1) % path.length;
    } else {
      current.lerp(targetVec, delta * 0.8);
      meshRef.current.lookAt(targetVec);
    }
  });

  return (
    <group ref={meshRef} position={path[0]}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <capsuleGeometry args={[0.35, 0.8, 6, 12]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>
    </group>
  );
};
