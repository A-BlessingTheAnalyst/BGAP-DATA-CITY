'use client';

import React, { useMemo, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { RigidBody } from '@react-three/rapier';

function PropModelInner({ url, position, rotation, scale = 1 }: {
  url: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => {
    const c = SkeletonUtils.clone(scene);
    c.traverse((node: any) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);

  const s = Array.isArray(scale) ? scale : [scale, scale, scale];

  return (
    <group position={position} rotation={rotation} scale={s as [number, number, number]}>
      <primitive object={cloned} />
    </group>
  );
}

function PropModel(props: {
  url: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  fallback?: React.ReactNode;
}) {
  return (
    <Suspense fallback={props.fallback || null}>
      <PropModelInner {...props} />
    </Suspense>
  );
}

export const WorldProps: React.FC = () => {
  // Streetlights along the main boulevard
  const streetlights: { pos: [number, number, number]; rot: [number, number, number] }[] = [
    { pos: [6.8, 0, -30], rot: [0, Math.PI / 2, 0] },
    { pos: [6.8, 0, -10], rot: [0, Math.PI / 2, 0] },
    { pos: [6.8, 0, 10], rot: [0, Math.PI / 2, 0] },
    { pos: [6.8, 0, 30], rot: [0, Math.PI / 2, 0] },
    { pos: [-6.8, 0, -30], rot: [0, -Math.PI / 2, 0] },
    { pos: [-6.8, 0, -10], rot: [0, -Math.PI / 2, 0] },
    { pos: [-6.8, 0, 10], rot: [0, -Math.PI / 2, 0] },
    { pos: [-6.8, 0, 30], rot: [0, -Math.PI / 2, 0] },
    { pos: [18, 0, 12], rot: [0, 0, 0] },
    { pos: [32, 0, 12], rot: [0, 0, 0] },
    { pos: [-24, 0, 24], rot: [0, Math.PI / 4, 0] },
    { pos: [-36, 0, 24], rot: [0, Math.PI / 4, 0] },
  ];

  // Benches
  const benches: { pos: [number, number, number]; rot: [number, number, number] }[] = [
    { pos: [8.5, 0, -5], rot: [0, -Math.PI / 2, 0] },
    { pos: [8.5, 0, 5], rot: [0, -Math.PI / 2, 0] },
    { pos: [-8.5, 0, -5], rot: [0, Math.PI / 2, 0] },
    { pos: [-8.5, 0, 5], rot: [0, Math.PI / 2, 0] },
    { pos: [16, 0, 24], rot: [0, Math.PI, 0] },
    { pos: [20, 0, 28], rot: [0, -Math.PI / 2, 0] },
  ];

  // Planters
  const planters: [number, number, number][] = [
    [8.5, 0, -20],
    [8.5, 0, 0],
    [8.5, 0, 20],
    [-8.5, 0, -20],
    [-8.5, 0, 0],
    [-8.5, 0, 20],
    [15, 0, 18],
    [32, 0, 18],
    [-22, 0, 32],
    [-42, 0, 32],
  ];

  // Parked Vehicles
  const vehicles: { pos: [number, number, number]; rot: [number, number, number] }[] = [
    { pos: [4.2, 0, -22], rot: [0, 0, 0] },
    { pos: [4.2, 0, 16], rot: [0, 0, 0] },
    { pos: [-4.2, 0, -14], rot: [0, Math.PI, 0] },
    { pos: [-4.2, 0, 24], rot: [0, Math.PI, 0] },
    { pos: [20, 0, 8], rot: [0, Math.PI / 2, 0] },
  ];

  // Holographic Billboards
  const billboards: { pos: [number, number, number]; rot: [number, number, number] }[] = [
    { pos: [12, 0, -42], rot: [0, -Math.PI / 6, 0] },
    { pos: [-12, 0, -42], rot: [0, Math.PI / 6, 0] },
    { pos: [38, 0, 8], rot: [0, -Math.PI / 4, 0] },
    { pos: [-28, 0, 18], rot: [0, Math.PI / 4, 0] },
  ];

  return (
    <group>
      {/* Streetlights */}
      {streetlights.map((sl, i) => (
        <group key={'sl-' + i}>
          <RigidBody type="fixed" colliders="hull">
            <PropModel url="/assets/world/streetlight.glb" position={sl.pos} rotation={sl.rot} />
          </RigidBody>
          <pointLight
            position={[sl.pos[0], 5.2, sl.pos[2]]}
            intensity={2.2}
            distance={16}
            color="#00F2FE"
            decay={2}
          />
        </group>
      ))}

      {/* Benches */}
      {benches.map((b, i) => (
        <RigidBody key={'bench-' + i} type="fixed" colliders="cuboid">
          <PropModel url="/assets/world/bench.glb" position={b.pos} rotation={b.rot} />
        </RigidBody>
      ))}

      {/* Cyber Planters */}
      {planters.map((p, i) => (
        <RigidBody key={'planter-' + i} type="fixed" colliders="hull">
          <PropModel url="/assets/world/planter.glb" position={p} />
        </RigidBody>
      ))}

      {/* Parked Vehicles */}
      {vehicles.map((v, i) => (
        <RigidBody key={'veh-' + i} type="fixed" colliders="hull">
          <PropModel url="/assets/world/vehicle_sedan.glb" position={v.pos} rotation={v.rot} />
        </RigidBody>
      ))}

      {/* Holographic Billboards */}
      {billboards.map((bb, i) => (
        <group key={'bb-' + i}>
          <RigidBody type="fixed" colliders="hull">
            <PropModel url="/assets/world/billboard.glb" position={bb.pos} rotation={bb.rot} />
          </RigidBody>
          <pointLight
            position={[bb.pos[0], 8.0, bb.pos[2]]}
            intensity={3.0}
            distance={22}
            color="#00F2FE"
            decay={2}
          />
        </group>
      ))}
    </group>
  );
};

if (typeof window !== 'undefined') {
  try {
    useGLTF.preload('/assets/world/streetlight.glb');
    useGLTF.preload('/assets/world/bench.glb');
    useGLTF.preload('/assets/world/planter.glb');
    useGLTF.preload('/assets/world/vehicle_sedan.glb');
    useGLTF.preload('/assets/world/billboard.glb');
  } catch (e) {}
}
