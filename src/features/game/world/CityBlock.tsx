'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { Mesh, Group } from 'three';

export const CityBlock: React.FC = () => {
  const obeliskRef = useRef<Mesh>(null);
  const ringsRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (obeliskRef.current) {
      obeliskRef.current.rotation.y += delta * 0.8;
      obeliskRef.current.position.y = 3.2 + Math.sin(Date.now() * 0.003) * 0.15;
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.y -= delta * 0.5;
    }
  });

  return (
    <group>
      {/* 1. Base Roadway Asphalt (Tactile Slate Gray) */}
      <RigidBody type="fixed" friction={1}>
        <mesh receiveShadow position={[0, -0.05, 0]}>
          <boxGeometry args={[140, 0.1, 140]} />
          <meshStandardMaterial color="#1E293B" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* 2. Main North-South Boulevard (14m wide) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[14, 120]} />
        <meshStandardMaterial color="#273244" roughness={0.65} />
      </mesh>

      {/* Boulevard Double-Yellow Median Strip */}
      {[-0.15, 0.15].map((yOff) => (
        <mesh key={'dym-' + yOff} rotation={[-Math.PI / 2, 0, 0]} position={[yOff, 0.02, 0]}>
          <planeGeometry args={[0.15, 120]} />
          <meshBasicMaterial color="#FBBF24" />
        </mesh>
      ))}

      {/* Dashed White Lane Lines */}
      {[-3.6, 3.6].map((lx) => (
        <group key={'lane-' + lx}>
          {Array.from({ length: 18 }).map((_, i) => (
            <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[lx, 0.02, -54 + i * 6.4]}>
              <planeGeometry args={[0.22, 3.2]} />
              <meshBasicMaterial color="#F8FAFC" />
            </mesh>
          ))}
        </group>
      ))}

      {/* 3. East-West Cross Boulevard (Towards Cafe & Financial District) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 10]} receiveShadow>
        <planeGeometry args={[120, 14]} />
        <meshStandardMaterial color="#273244" roughness={0.65} />
      </mesh>
      {[-0.15, 0.15].map((yOff) => (
        <mesh key={'dym-ew-' + yOff} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.022, 10 + yOff]}>
          <planeGeometry args={[120, 0.15]} />
          <meshBasicMaterial color="#FBBF24" />
        </mesh>
      ))}

      {/* 4. Intersection Zebra Crosswalks */}
      {/* North Crosswalk */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={'ncw-' + i} rotation={[-Math.PI / 2, 0, 0]} position={[-5.6 + i * 1.4, 0.025, 2]}>
          <planeGeometry args={[0.95, 3.2]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      ))}
      {/* South Crosswalk */}
      {Array.from({ length: 9 }).map((_, i) => (
        <mesh key={'scw-' + i} rotation={[-Math.PI / 2, 0, 0]} position={[-5.6 + i * 1.4, 0.025, 18]}>
          <planeGeometry args={[0.95, 3.2]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      ))}

      {/* 5. Sidewalks (Bright Architectural Concrete with Curbs) */}
      <RigidBody type="fixed">
        {/* East Sidewalk */}
        <mesh receiveShadow position={[10.5, 0.12, 0]}>
          <boxGeometry args={[7, 0.24, 120]} />
          <meshStandardMaterial color="#94A3B8" roughness={0.5} />
        </mesh>
        {/* West Sidewalk */}
        <mesh receiveShadow position={[-10.5, 0.12, 0]}>
          <boxGeometry args={[7, 0.24, 120]} />
          <meshStandardMaterial color="#94A3B8" roughness={0.5} />
        </mesh>
      </RigidBody>

      {/* 6. Academy Courtyard Garden & Monument (Placed in front of Academy entrance at z = -12) */}
      <group position={[0, 0, -11]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
          <circleGeometry args={[4.5, 32]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.4} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.028, 0]}>
          <ringGeometry args={[2.5, 3.8, 32]} />
          <meshBasicMaterial color="#00F2FE" />
        </mesh>

        {/* Tiered Plaza Pedestal */}
        <RigidBody type="fixed" colliders="hull">
          <mesh position={[0, 0.4, 0]} receiveShadow>
            <cylinderGeometry args={[1.8, 2.2, 0.8, 16]} />
            <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh position={[0, 1.2, 0]} receiveShadow>
            <cylinderGeometry args={[1.2, 1.5, 0.8, 16]} />
            <meshStandardMaterial color="#0F172A" roughness={0.2} metalness={0.9} />
          </mesh>
        </RigidBody>

        {/* Levitating Glowing Cyan Data Core */}
        <mesh ref={obeliskRef} position={[0, 3.2, 0]}>
          <octahedronGeometry args={[0.85]} />
          <meshStandardMaterial
            color="#00F2FE"
            emissive="#00F2FE"
            emissiveIntensity={3.5}
            roughness={0.1}
            metalness={0.3}
          />
        </mesh>

        {/* Orbiting Tech Rings */}
        <group ref={ringsRef} position={[0, 3.2, 0]}>
          <mesh rotation={[Math.PI / 4, 0, 0]}>
            <torusGeometry args={[1.4, 0.03, 16, 32]} />
            <meshBasicMaterial color="#F59E0B" />
          </mesh>
          <mesh rotation={[-Math.PI / 4, Math.PI / 3, 0]}>
            <torusGeometry args={[1.7, 0.03, 16, 32]} />
            <meshBasicMaterial color="#00F2FE" />
          </mesh>
        </group>
      </group>

      {/* 7. Perimeter Safety Barriers (Prevent falling off world) */}
      <RigidBody type="fixed">
        <mesh position={[0, 2, -68]} visible={false}>
          <boxGeometry args={[138, 6, 2]} />
        </mesh>
        <mesh position={[0, 2, 68]} visible={false}>
          <boxGeometry args={[138, 6, 2]} />
        </mesh>
        <mesh position={[-68, 2, 0]} visible={false}>
          <boxGeometry args={[2, 6, 138]} />
        </mesh>
        <mesh position={[68, 2, 0]} visible={false}>
          <boxGeometry args={[2, 6, 138]} />
        </mesh>
      </RigidBody>
    </group>
  );
};
