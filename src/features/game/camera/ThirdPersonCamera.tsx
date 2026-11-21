'use client';
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import { PerspectiveCamera, Vector3 } from 'three';
import { useGameState } from '../engine/GameState';
import { driveRuntime, playerRuntime } from '../characters/PlayerCharacter';
import { runtimeInput } from '../input/InputManager';

const DISTANCE = 5;
const MIN_DISTANCE = 0.8;
/** After the player lets go of the camera, how long before the chase cam swings back behind the car. */
const CHASE_DELAY = 1.2;

/** Last time (performance.now, ms) the player dragged the camera. */
let lastManualLook = 0;
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * Orbit camera behind the player. Mouse/touch drag orbits; the wheel zooms.
 * Occlusion uses a Rapier ray against the building colliders, so the camera
 * slides in front of walls instead of clipping through them. Must live inside <Physics>.
 */
export function ThirdPersonCamera() {
  const { camera, gl } = useThree();
  const { world, rapier } = useRapier();
  const look = useRef(new Vector3()), target = useRef(new Vector3()), desired = useRef(new Vector3()), dir = useRef(new Vector3());
  const zoom = useRef(1);
  const ray = useRef<InstanceType<typeof rapier.Ray> | null>(null);

  useEffect(() => {
    let drag = false, x = 0, y = 0;
    const locked = () => { const s = useGameState.getState(); return s.isPaused || s.isDialogueActive || s.isWorkstationActive || s.isMapOpen; };
    const down = (e: PointerEvent) => { if (e.button === 0 || e.button === 2) { drag = true; x = e.clientX; y = e.clientY; gl.domElement.setPointerCapture(e.pointerId); } };
    const move = (e: PointerEvent) => {
      if (!drag || locked()) return;
      runtimeInput.yaw -= (e.clientX - x) * 0.005;
      runtimeInput.pitch = Math.max(0.05, Math.min(1.2, runtimeInput.pitch + (e.clientY - y) * 0.005));
      x = e.clientX; y = e.clientY;
      lastManualLook = performance.now();
    };
    const up = () => { drag = false; };
    const context = (e: Event) => e.preventDefault();
    const wheel = (e: WheelEvent) => { if (!locked()) zoom.current = Math.max(0.5, Math.min(2.4, zoom.current * (e.deltaY > 0 ? 1.1 : 0.9))); };
    const el = gl.domElement;
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('contextmenu', context);
    el.addEventListener('wheel', wheel, { passive: true });
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('contextmenu', context);
      el.removeEventListener('wheel', wheel);
    };
  }, [gl]);

  const chaseDist = useRef(DISTANCE);
  useFrame((_, dt) => {
    const s = useGameState.getState(), p = playerRuntime.position;
    const d = Math.min(dt, 0.05);
    // Chase cam while driving: swing in behind the vehicle once the player isn't steering the
    // camera, pull back and lift with speed, and open the FOV a touch for a sense of pace.
    const speed = s.isDriving ? Math.abs(driveRuntime.speed) : 0;
    if (s.isDriving) {
      if (performance.now() - lastManualLook > CHASE_DELAY * 1000 && speed > 0.5) {
        const behind = driveRuntime.rotationY + Math.PI;
        runtimeInput.yaw += wrap(behind - runtimeInput.yaw) * (1 - Math.exp(-3.2 * d));
        runtimeInput.pitch += (0.3 - runtimeInput.pitch) * (1 - Math.exp(-1.5 * d));
      }
    }
    const wantDist = s.isDriving ? 7.5 + Math.min(4, speed * 0.16) : DISTANCE;
    chaseDist.current += (wantDist - chaseDist.current) * (1 - Math.exp(-2.5 * d));
    const cam = camera as PerspectiveCamera;
    const fov = 55 + (s.isDriving ? Math.min(10, speed * 0.4) : 0);
    if (Math.abs(cam.fov - fov) > 0.05) { cam.fov += (fov - cam.fov) * (1 - Math.exp(-3 * d)); cam.updateProjectionMatrix(); }
    const dist = chaseDist.current * zoom.current;
    target.current.set(p.x, p.y + 0.8, p.z);
    desired.current.set(
      p.x + Math.sin(runtimeInput.yaw) * dist * Math.cos(runtimeInput.pitch),
      p.y + 1.3 + Math.sin(runtimeInput.pitch) * dist,
      p.z + Math.cos(runtimeInput.yaw) * dist * Math.cos(runtimeInput.pitch),
    );
    if (s.cameraMode !== 'follow' && s.cameraTarget) {
      target.current.set(s.cameraTarget[0], s.cameraTarget[1] + 1.2, s.cameraTarget[2]);
      desired.current.copy(target.current).add(new Vector3(2, 0.4, 3));
    }

    // Pull the camera in front of the first fixed collider between the target and the camera.
    dir.current.copy(desired.current).sub(target.current);
    const length = dir.current.length();
    dir.current.divideScalar(length || 1);
    ray.current ??= new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 });
    ray.current.origin = { x: target.current.x, y: target.current.y, z: target.current.z };
    ray.current.dir = { x: dir.current.x, y: dir.current.y, z: dir.current.z };
    const hit = world.castRay(ray.current, length, true, rapier.QueryFilterFlags.EXCLUDE_SENSORS | rapier.QueryFilterFlags.EXCLUDE_KINEMATIC | rapier.QueryFilterFlags.EXCLUDE_DYNAMIC);
    const blocked = hit && hit.timeOfImpact < length;
    if (blocked) desired.current.copy(target.current).addScaledVector(dir.current, Math.max(MIN_DISTANCE, hit.timeOfImpact - 0.35));
    desired.current.y = Math.max(desired.current.y, 0.35);

    // Snap in fast when a wall cuts in (no frame inside the wall), ease out slowly.
    const factor = 1 - Math.exp(-(blocked ? 25 : 8) * Math.min(dt, 0.05));
    camera.position.lerp(desired.current, factor);
    look.current.lerp(target.current, 1 - Math.exp(-8 * Math.min(dt, 0.05)));
    camera.lookAt(look.current);
  });
  return null;
}
