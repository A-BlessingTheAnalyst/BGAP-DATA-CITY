'use client';
import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { InstancedMesh2 } from '@three.ez/instanced-mesh';
import { Euler, Group, Matrix4, Mesh, Object3D, Quaternion, Vector3 } from 'three';
import { kitInfo, KitRef, kitRoot, prepareMaterial } from './KitModel';
import type { V3 } from './parts';

// Draws many copies of one kit model (palms, streetlights, tanks, parked cars) as
// InstancedMesh2: one draw call per sub-mesh, per-instance frustum culling via BVH.

export interface Placement { position: V3; rotationY?: number; scale?: number; /** Per-instance tint multiplied over the material. */ color?: string }

export function InstancedKit({ kit, items, shadows = true, warm = true }: { kit: KitRef; items: Placement[]; shadows?: boolean; warm?: boolean }) {
  const info = kitInfo(kit);
  const { scene } = useGLTF(info.url, false, true);
  const gl = useThree((s) => s.gl);

  const group = useMemo(() => {
    const g = new Group();
    const root = kitRoot(scene, info.node);
    root.updateWorldMatrix(true, true);
    const toRoot = root.matrixWorld.clone().invert();
    const local = new Matrix4(), world = new Matrix4(), place = new Matrix4();
    const q = new Quaternion(), e = new Euler(), p = new Vector3(), s = new Vector3();
    root.traverse((n) => {
      const mesh = n as Mesh;
      if (!mesh.isMesh) return;
      local.multiplyMatrices(toRoot, mesh.matrixWorld); // sub-mesh transform inside the model
      const im = new InstancedMesh2(mesh.geometry.clone(), prepareMaterial(mesh.material, warm), { capacity: items.length, renderer: gl });
      im.castShadow = shadows;
      im.receiveShadow = true;
      im.addInstances(items.length, (obj, i) => {
        const it = items[i];
        const k = (it.scale ?? 1) * info.scale;
        q.setFromEuler(e.set(0, it.rotationY ?? 0, 0));
        place.compose(p.set(...it.position), q, s.set(k, k, k));
        world.multiplyMatrices(place, local);
        world.decompose(obj.position, obj.quaternion, obj.scale);
      });
      items.forEach((it, i) => { if (it.color) im.setColorAt(i, it.color); });
      im.computeBVH();
      // InstancedMesh2 is typed against a newer @types/three; the runtime supports r159+.
      g.add(im as unknown as Object3D);
    });
    return g;
  }, [scene, info.node, items, info.scale, gl, shadows, warm]);

  useEffect(() => () => group.children.forEach((c) => { const im = c as unknown as InstancedMesh2; im.geometry.dispose(); im.dispose(); }), [group]);
  return <primitive object={group} />;
}
