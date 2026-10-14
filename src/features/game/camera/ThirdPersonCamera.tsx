"use client";

import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameState } from '../engine/GameState';
import { GAME_CONFIG } from '@/shared/constants/gameConfig';

export const ThirdPersonCamera: React.FC = () => {
  const { camera } = useThree();
  const playerPos = useGameState((s) => s.playerPosition);
  const cameraMode = useGameState((s) => s.cameraMode);
  const cameraTarget = useGameState((s) => s.cameraTarget);

  const currentCamPos = useRef(new THREE.Vector3(0, 5, -8));
  const currentLookAt = useRef(new THREE.Vector3(0, 1.5, 0));

  useFrame((_, delta) => {
    let idealCamPos = new THREE.Vector3();
    let idealLookAt = new THREE.Vector3();

    if (cameraMode === 'conversation' && cameraTarget) {
      // Cinematic dialog framing
      idealLookAt.set(cameraTarget[0], cameraTarget[1] + 1.2, cameraTarget[2]);
      idealCamPos.set(cameraTarget[0] + 1.8, cameraTarget[1] + 1.5, cameraTarget[2] + 2.0);
    } else if (cameraMode === 'interaction' && cameraTarget) {
      // Workstation view
      idealLookAt.set(cameraTarget[0], cameraTarget[1] + 0.9, cameraTarget[2]);
      idealCamPos.set(cameraTarget[0], cameraTarget[1] + 1.8, cameraTarget[2] + 1.5);
    } else {
      // Standard third-person chase camera
      const [ox, oy, oz] = GAME_CONFIG.camera.followOffset;
      idealCamPos.set(playerPos[0] + ox, playerPos[1] + oy, playerPos[2] + oz);
      idealLookAt.set(playerPos[0], playerPos[1] + GAME_CONFIG.camera.followLookAtOffset[1], playerPos[2]);
    }

    const smoothFactor = 1 - Math.exp(-8 * delta);
    currentCamPos.current.lerp(idealCamPos, smoothFactor);
    currentLookAt.current.lerp(idealLookAt, smoothFactor);

    camera.position.copy(currentCamPos.current);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};
