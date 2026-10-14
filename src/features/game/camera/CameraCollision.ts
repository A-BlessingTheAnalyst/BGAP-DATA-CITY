import * as THREE from 'three';

export function checkCameraOcclusion(
  targetPos: THREE.Vector3,
  desiredCameraPos: THREE.Vector3,
  colliders: THREE.Object3D[]
): THREE.Vector3 {
  const dir = new THREE.Vector3().subVectors(desiredCameraPos, targetPos);
  const distance = dir.length();
  dir.normalize();

  const raycaster = new THREE.Raycaster(targetPos, dir, 0.1, distance);
  const hits = raycaster.intersectObjects(colliders, true);

  if (hits.length > 0) {
    const hit = hits[0];
    return hit.point.clone().addScaledVector(dir, -0.2);
  }
  return desiredCameraPos;
}
