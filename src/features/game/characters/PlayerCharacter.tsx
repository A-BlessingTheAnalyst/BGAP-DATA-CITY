'use client';
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, RapierRigidBody, useRapier } from '@react-three/rapier';
import { Group, Vector3, MathUtils } from 'three';
import { useGameState } from '../engine/GameState';
import { useInput } from '../input/useInput';
import { Humanoid } from './Humanoid';
export const playerRuntime = { position: new Vector3(0, 0.95, 0), rotation: 0, speed: 0 };
export function PlayerCharacter() {
 const body = useRef<RapierRigidBody>(null), visual = useRef<Group>(null);
 const { world } = useRapier();
 const controller = useRef<ReturnType<typeof world.createCharacterController>>();
 const input = useInput(), velocity = useRef(new Vector3()), elapsed = useRef(0);
 useEffect(() => {
  const c = world.createCharacterController(0.02);
  c.enableAutostep(0.3, 0.2, true); c.enableSnapToGround(0.3); c.setMaxSlopeClimbAngle(Math.PI / 4);
  controller.current = c;
  return () => { world.removeCharacterController(c); controller.current = undefined; };
 }, [world]);
 useFrame((_, dt) => {
  if (!body.current || !controller.current) return;
  const delta = Math.min(dt, 0.04), s = useGameState.getState();
  const blocked = s.isPaused || s.isDialogueActive || s.isWorkstationActive;
  let x = blocked ? 0 : Number(input.right) - Number(input.left) + input.axisX;
  let z = blocked ? 0 : Number(input.backward) - Number(input.forward) + input.axisZ;
  const length = Math.max(1, Math.hypot(x, z)); x /= length; z /= length;
  const speed = input.sprint ? 7 : 4, sin = Math.sin(input.yaw), cos = Math.cos(input.yaw);
  velocity.current.x = blocked ? 0 : MathUtils.damp(velocity.current.x, (x * cos + z * sin) * speed, 12, delta);
  velocity.current.z = blocked ? 0 : MathUtils.damp(velocity.current.z, (z * cos - x * sin) * speed, 12, delta);
  velocity.current.y = controller.current.computedGrounded() ? -0.5 : Math.max(-20, velocity.current.y - 9.81 * delta);
  controller.current.computeColliderMovement(body.current.collider(0), { x: velocity.current.x * delta, y: velocity.current.y * delta, z: velocity.current.z * delta });
  const movement = controller.current.computedMovement(), p = body.current.translation();
  const out = p.y < -10 || Math.abs(p.x) > 55 || Math.abs(p.z) > 55;
  body.current.setNextKinematicTranslation(out ? { x: 0, y: 0.95, z: 0 } : { x: p.x + movement.x, y: p.y + movement.y, z: p.z + movement.z });
  playerRuntime.position.set(p.x, p.y, p.z); playerRuntime.speed = Math.hypot(movement.x, movement.z) / delta;
  if (playerRuntime.speed > 0.1 && visual.current) {
   const target = Math.atan2(velocity.current.x, velocity.current.z);
   const diff = Math.atan2(Math.sin(target - visual.current.rotation.y), Math.cos(target - visual.current.rotation.y));
   visual.current.rotation.y += diff * (1 - Math.exp(-12 * delta)); playerRuntime.rotation = visual.current.rotation.y;
  }
  elapsed.current += delta;
  if (elapsed.current > 0.1) { s.setPlayerTransform([p.x, p.y, p.z], playerRuntime.rotation); elapsed.current = 0; }
 });
 return <RigidBody ref={body} type="kinematicPosition" colliders={false} position={[0, 0.95, 0]} enabledRotations={[false, false, false]}>
  <CapsuleCollider args={[0.55, 0.32]} /><group ref={visual} position={[0, -0.87, 0]}><Humanoid speed={() => playerRuntime.speed} /></group>
 </RigidBody>;
}
