'use client';
import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import type { Group } from 'three';
import { CastMember } from '../../world/kit/CastMember';
import { useGameState } from '../../engine/GameState';
import type { CharacterDef } from '../../world/kit/characters';

/** Slow turntable so every side of the outfit is seen; drag to spin it yourself. */
function Turntable({ def, spin }: { def: CharacterDef; spin: boolean }) {
  const g = useRef<Group>(null);
  const drag = useRef<{ x: number; v: number } | null>(null);
  useFrame((_, dt) => {
    if (!g.current) return;
    if (spin && !drag.current) g.current.rotation.y += dt * 0.5;
  });
  return (
    <group
      ref={g}
      onPointerDown={(e) => { drag.current = { x: e.clientX, v: 0 }; (e.target as Element).setPointerCapture?.(e.pointerId); }}
      onPointerMove={(e) => { if (drag.current && g.current) { g.current.rotation.y += (e.clientX - drag.current.x) * 0.01; drag.current.x = e.clientX; } }}
      onPointerUp={() => { drag.current = null; }}
    >
      <CastMember def={def} action="Idle" />
      {/* Invisible hit target so the whole figure can be dragged. */}
      <mesh position={[0, 0.9, 0]} visible={false}>
        <cylinderGeometry args={[0.45, 0.45, 1.9, 8]} />
      </mesh>
    </group>
  );
}

/** A small, self-contained 3D view of a cadet (creator, wardrobe, tailor try-on). */
export function CadetPreview({ def, className = '', spin = true }: { def: CharacterDef; className?: string; spin?: boolean }) {
  const reducedMotion = useGameState((s) => s.reducedMotion);
  const autoSpin = spin && !reducedMotion;
  return (
    <div className={`relative ${className}`}>
      <Canvas camera={{ position: [0, 1.15, 3.9], fov: 32 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }} onCreated={({ camera }) => camera.lookAt(0, 0.88, 0)}>
        <hemisphereLight args={['#FFF1D9', '#5A4636', 0.9]} />
        <directionalLight position={[2.5, 4, 3]} intensity={2.2} color="#FFE1B5" />
        <directionalLight position={[-3, 2, -2]} intensity={0.6} color="#BFD6EA" />
        <Suspense fallback={null}>
          <Turntable def={def} spin={autoSpin} />
        </Suspense>
        <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={3} blur={2.4} far={2} />
      </Canvas>
    </div>
  );
}
