'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { Group } from 'three';

interface Props {
  position: [number, number, number];
}

export const DataCenterBuilding: React.FC<Props> = ({ position }) => {
  const fansRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (fansRef.current) {
      fansRef.current.children.forEach((fan) => {
        fan.rotation.z += delta * 6;
      });
    }
  });

  return (
    <group position={position}>
      {/* Warehouse / Server Bunker Structure */}
      <RigidBody type="fixed">
        <mesh position={[0, 6, 0]} castShadow receiveShadow userData={{ cameraBlocker: true }}>
          <boxGeometry args={[24, 12, 18]} />
          <meshStandardMaterial color="#0F172A" roughness={0.6} metalness={0.7} />
        </mesh>
      </RigidBody>

      {/* Glowing Cybernetic Data Conduits (Pipes along exterior wall) */}
      {[2, 4, 6].map((py) => (
        <mesh key={py} position={[0, py, 9.15]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 22, 16]} />
          <meshStandardMaterial
            color="#00F2FE"
            emissive="#00F2FE"
            emissiveIntensity={2.5}
            roughness={0.1}
          />
        </mesh>
      ))}

      {/* Rooftop Industrial Cooling Unit */}
      <mesh position={[0, 13, 0]}>
        <boxGeometry args={[18, 2, 12]} />
        <meshStandardMaterial color="#1E293B" metalness={0.8} />
      </mesh>

      {/* Rotating Industrial Fan Blades */}
      <group ref={fansRef} position={[0, 14.1, 0]}>
        {[-5, 0, 5].map((fx) => (
          <mesh key={fx} position={[fx, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[1.5, 1.5, 0.1, 6]} />
            <meshStandardMaterial color="#00F2FE" emissive="#0284C7" emissiveIntensity={0.8} />
          </mesh>
        ))}
      </group>

      {/* Data Center Sign */}
      <mesh position={[0, 9, 9.15]}>
        <boxGeometry args={[14, 1.4, 0.2]} />
        <meshStandardMaterial
          color="#10B981"
          emissive="#059669"
          emissiveIntensity={2.0}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
};
