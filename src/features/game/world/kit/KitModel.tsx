'use client';
import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { CanvasTexture, Material, Mesh, MeshStandardMaterial, Object3D, SRGBColorSpace, Texture } from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { KIT_INDEX, PACK_SCALE, kitInfo, kitSize, type KitRef } from './kitData';
import type { V3 } from './parts';

export { KIT_INDEX, PACK_SCALE, kitInfo, kitSize };
export type { KitRef };

/** The object for a kit model inside its loaded GLB: the whole scene, or one piece of a bundle. */
export function kitRoot(scene: Object3D, node?: string): Object3D {
  if (!node) return scene;
  const found = scene.getObjectByName(node);
  if (!found) throw new Error(`Bundle piece ${node} missing; re-run the optimizer`);
  return found;
}

const warmCache = new WeakMap<Texture, Texture>();
/** Sun-faded variant of a palette texture: warmer, slightly desaturated, like Lagos plaster. */
function warmTexture(src: Texture): Texture {
  const hit = warmCache.get(src);
  if (hit) return hit;
  const img = src.image as CanvasImageSource & { width: number; height: number };
  if (!img || !img.width) return src;
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d')!;
  ctx.filter = 'sepia(0.28) saturate(1.08) hue-rotate(-6deg) brightness(1.04)';
  ctx.drawImage(img, 0, 0);
  const t = new CanvasTexture(c);
  t.flipY = src.flipY;
  t.colorSpace = SRGBColorSpace;
  t.magFilter = src.magFilter;
  t.minFilter = src.minFilter;
  warmCache.set(src, t);
  return t;
}

/** Clone a kit material with the sun-faded palette and/or a colour tint applied. */
export function prepareMaterial<M extends Material | Material[]>(m: M, warm = true, tint?: string): M {
  const one = (x: Material) => {
    const std = (x as MeshStandardMaterial).clone();
    if (warm && std.map) std.map = warmTexture(std.map);
    if (tint) std.color.set(tint);
    return std;
  };
  return (Array.isArray(m) ? m.map(one) : one(m as Material)) as unknown as M;
}

export function KitModel({ kit, position, rotation, scale, warm = true, tint, shadows = true, center = false }: {
  kit: KitRef; position?: V3; rotation?: V3 | number; scale?: number; warm?: boolean; tint?: string; shadows?: boolean;
  /** Recentre on the footprint (some models have their origin at a corner or front edge). */
  center?: boolean;
}) {
  const info = kitInfo(kit);
  const { scene } = useGLTF(info.url, false, true);
  const object = useMemo(() => {
    const src = kitRoot(scene, info.node);
    const o: Object3D = info.skinned ? SkeletonUtils.clone(src) : src.clone(true);
    o.position.set(0, 0, 0);
    o.traverse((n) => {
      const mesh = n as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = shadows;
      mesh.receiveShadow = true;
      if (warm || tint) mesh.material = prepareMaterial(mesh.material, warm, tint);
    });
    return o;
  }, [scene, info.skinned, info.node, warm, tint, shadows]);
  const s = scale ?? info.scale;
  const rot: V3 = typeof rotation === 'number' ? [0, rotation, 0] : rotation ?? [0, 0, 0];
  const off: V3 = center ? [-(info.min[0] + info.max[0]) / 2, 0, -(info.min[2] + info.max[2]) / 2] : [0, 0, 0];
  return (
    <group position={position} rotation={rot} scale={s}>
      <primitive object={object} position={off} />
    </group>
  );
}

export function preloadKit(refs: KitRef[]) {
  refs.forEach((r) => useGLTF.preload(kitInfo(r).url, false, true));
}
