'use client';

import React, { useRef, useEffect, useMemo, useState } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { Group, Mesh } from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Humanoid } from './Humanoid';

interface RiggedHumanoidProps {
  modelUrl: string;
  actionName: string;
  fallbackShirt?: string;
  fallbackSkin?: string;
  speed?: () => number;
  speaking?: boolean;
  scale?: number;
}

function RiggedModel({
  modelUrl,
  actionName,
  scale = 1.0,
}: {
  modelUrl: string;
  actionName: string;
  scale?: number;
}) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(modelUrl);

  const clone = useMemo(() => {
    const cloned = SkeletonUtils.clone(scene) as Group;
    cloned.traverse((node) => {
      if ((node as Mesh).isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    return cloned;
  }, [scene]);

  const { actions } = useAnimations(animations, group);
  const activeAction = useRef<string>('');

  useEffect(() => {
    const nextAction = actions[actionName] ? actionName : actions['Idle'] ? 'Idle' : Object.keys(actions)[0];
    if (!nextAction) return;

    if (activeAction.current !== nextAction) {
      const prev = actions[activeAction.current];
      const next = actions[nextAction];

      if (prev) {
        prev.fadeOut(0.25);
      }
      if (next) {
        next.reset().fadeIn(0.25).play();
      }
      activeAction.current = nextAction;
    }
  }, [actionName, actions]);

  return (
    <group ref={group} scale={[scale, scale, scale]} dispose={null}>
      <primitive object={clone} />
    </group>
  );
}

export function RiggedHumanoid({
  modelUrl,
  actionName,
  fallbackShirt,
  fallbackSkin,
  speed,
  speaking,
  scale = 1.0,
}: RiggedHumanoidProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <Humanoid speed={speed} speaking={speaking} shirt={fallbackShirt} skin={fallbackSkin} />;
  }

  return (
    <React.Suspense fallback={<Humanoid speed={speed} speaking={speaking} shirt={fallbackShirt} skin={fallbackSkin} />}>
      <RiggedModel modelUrl={modelUrl} actionName={actionName} scale={scale} />
    </React.Suspense>
  );
}

// Preload models for immediate smooth rendering
if (typeof window !== 'undefined') {
  try {
    useGLTF.preload('/assets/characters/analyst.glb');
    useGLTF.preload('/assets/characters/mama_bisi.glb');
    useGLTF.preload('/assets/characters/guard.glb');
  } catch (e) {
    // Ignore during SSR
  }
}
