"use client";

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameState } from '../engine/GameState';
import { useInput } from '../input/useInput';
import { GAME_CONFIG } from '@/shared/constants/gameConfig';

export const PlayerCharacter: React.FC = () => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Group>(null);
  const setPlayerTransform = useGameState((s) => s.setPlayerTransform);
  const isDialogueActive = useGameState((s) => s.isDialogueActive);
  const isWorkstationActive = useGameState((s) => s.isWorkstationActive);
  const input = useInput();

  useFrame((_, delta) => {
    if (!rigidBodyRef.current || isDialogueActive || isWorkstationActive) return;

    const { forward, backward, left, right, sprint } = input;
    const moveX = (right ? 1 : 0) - (left ? 1 : 0);
    const moveZ = (backward ? 1 : 0) - (forward ? 1 : 0);

    const speed = sprint ? GAME_CONFIG.player.runSpeed : GAME_CONFIG.player.walkSpeed;
    const linvel = rigidBodyRef.current.linvel();

    if (moveX !== 0 || moveZ !== 0) {
      const angle = Math.atan2(moveX, moveZ);
      if (meshRef.current) {
        meshRef.current.rotation.y = THREE.MathUtils.lerp(
          meshRef.current.rotation.y,
          angle,
          GAME_CONFIG.player.turnSpeed * delta
        );
      }
      rigidBodyRef.current.setLinvel({ x: moveX * speed, y: linvel.y, z: moveZ * speed }, true);
    } else {
      rigidBodyRef.current.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
    }

    const pos = rigidBodyRef.current.translation();
    const rot = meshRef.current ? meshRef.current.rotation.y : 0;
    setPlayerTransform([pos.x, pos.y, pos.z], rot);
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders="hull"
      position={[0, 1.2, 0]}
      enabledRotations={[false, false, false]}
      friction={0.5}
      mass={75}
    >
      <group ref={meshRef}>
        {/* Character Stylized Mesh Placeholder */}
        <mesh position={[0, 0.45, 0]} castShadow>
          <capsuleGeometry args={[GAME_CONFIG.player.capsuleRadius, GAME_CONFIG.player.capsuleHeight * 0.5, 8, 16]} />
          <meshStandardMaterial color="#10B981" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Analyst Visor Indicator */}
        <mesh position={[0, 0.75, 0.35]}>
          <boxGeometry args={[0.35, 0.1, 0.15]} />
          <meshBasicMaterial color="#00F2FE" />
        </mesh>
      </group>
    </RigidBody>
  );
};
