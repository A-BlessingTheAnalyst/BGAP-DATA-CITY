'use client';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider, RapierRigidBody, useRapier } from '@react-three/rapier';
import { Group, MathUtils } from 'three';
import { useGameState } from '../engine/GameState';
import { InteractionTrigger } from '../physics/InteractionTrigger';
import { Car, Tricycle } from './kit/vehicles';
import { runtimeInput } from '../input/InputManager';
import { driveRuntime, playerRuntime } from '../characters/PlayerCharacter';
import { callCar, useGarage } from '../ui/garage/useGarage';
import type { OwnedVehicle, VehicleDef } from '@/shared/types/garage';

/** Rough box footprint per body style, matching the kit models closely enough for collision. */
const FOOTPRINT: Record<VehicleDef['body'], [number, number, number]> = {
  hatchback: [1.8, 1.6, 3.9], sedan: [1.8, 1.6, 4.5], taxi: [1.8, 1.7, 4.4],
  suv: [2, 2, 4.7], pickup: [1.9, 2, 5.2], keke: [1.4, 2.2, 2.4],
};
const ACCEL = 6, BRAKE = 10, TURN_RATE = 1.8, DRAG = 2.2;

/** A car the player owns, parked where the garage/server says. Drive it with E, WASD, exit with E. */
export function DrivableCar({ owned, def }: { owned: OwnedVehicle; def: VehicleDef }) {
  const { world } = useRapier();
  const body = useRef<RapierRigidBody>(null);
  const visual = useRef<Group>(null);
  const controller = useRef<ReturnType<typeof world.createCharacterController>>();
  const speed = useRef(0);
  const yaw = useRef(owned.rotationY);
  const pos = useRef<[number, number, number]>(owned.position);
  const isMine = useGameState((s) => s.isDriving && s.drivingVehicleId === def.id);
  const anyoneDriving = useGameState((s) => s.isDriving);
  const hasLicence = useGarage((s) => s.hasLicence);

  useEffect(() => {
    const c = world.createCharacterController(0.02);
    c.enableSnapToGround(0.3);
    controller.current = c;
    return () => { world.removeCharacterController(c); controller.current = undefined; };
  }, [world]);

  // Re-sync from the server's last known position/rotation whenever this car is (re)called or bought.
  useEffect(() => {
    pos.current = owned.position;
    yaw.current = owned.rotationY;
    speed.current = 0;
    body.current?.setNextKinematicTranslation({ x: owned.position[0], y: owned.position[1], z: owned.position[2] });
  }, [owned.position[0], owned.position[1], owned.position[2], owned.rotationY]);

  useFrame((_, dt) => {
    if (!body.current || !controller.current) return;
    const delta = Math.min(dt, 0.04);
    const [x0, y0, z0] = pos.current;

    if (isMine) {
      const throttle = (runtimeInput.forward ? 1 : 0) - (runtimeInput.backward ? 1 : 0);
      const steer = (runtimeInput.left ? 1 : 0) - (runtimeInput.right ? 1 : 0);
      const maxSpeed = def.maxSpeed * (runtimeInput.sprint ? 1 : 0.6);
      if (throttle !== 0) speed.current = MathUtils.clamp(speed.current + throttle * ACCEL * delta, -maxSpeed * 0.5, maxSpeed);
      else speed.current = MathUtils.damp(speed.current, 0, BRAKE / 4, delta);
      speed.current = MathUtils.damp(speed.current, speed.current * (1 - DRAG * delta), 20, delta);
      // Can only steer while moving (and reversed steering feels right in reverse).
      if (Math.abs(speed.current) > 0.3) yaw.current += steer * TURN_RATE * delta * Math.sign(speed.current) * Math.min(1, Math.abs(speed.current) / 3);

      const dx = Math.sin(yaw.current) * speed.current * delta;
      const dz = Math.cos(yaw.current) * speed.current * delta;
      controller.current.computeColliderMovement(body.current.collider(0), { x: dx, y: -0.3 * delta, z: dz });
      const m = controller.current.computedMovement();
      if (Math.abs(m.x) < Math.abs(dx) * 0.4 || Math.abs(m.z) < Math.abs(dz) * 0.4) speed.current *= 0.3; // hit something: shed speed
      pos.current = [x0 + m.x, Math.max(y0 + m.y, FOOTPRINT[def.body][1] / 2), z0 + m.z];
      body.current.setNextKinematicTranslation({ x: pos.current[0], y: pos.current[1], z: pos.current[2] });
      driveRuntime.position.set(pos.current[0], pos.current[1] + 0.3, pos.current[2]);
      driveRuntime.rotationY = yaw.current;
    }

    if (visual.current) { visual.current.position.set(...pos.current); visual.current.rotation.y = yaw.current; }
  });

  const enterTarget = { id: `vehicle:${def.id}`, type: 'vehicle' as const, label: def.name, actionText: hasLicence ? `Enter ${def.name} [E]` : `${def.name} — pass your driving test first`, position: pos.current, radius: 2.4 };
  const [w, h, len] = FOOTPRINT[def.body];

  return (
    <>
      <RigidBody ref={body} type="kinematicPosition" colliders={false} position={owned.position} enabledRotations={[false, false, false]}>
        <CuboidCollider args={[w / 2, h / 2, len / 2]} position={[0, h / 2, 0]} />
      </RigidBody>
      <group ref={visual} position={owned.position} rotation={[0, owned.rotationY, 0]}>
        {def.body === 'keke' ? <Tricycle color={def.color} /> : <Car body={def.body === 'taxi' ? 'taxi' : def.body} color={def.color} />}
      </group>
      {!isMine && !anyoneDriving && <InteractionTrigger target={enterTarget} />}
    </>
  );
}

/** Calls every owned car to a ring of parking spots near the player (DataPhone "Call to me"). */
export async function callAllNear(ownedIds: string[], around: [number, number, number]) {
  for (let i = 0; i < ownedIds.length; i++) {
    const a = (i / Math.max(1, ownedIds.length)) * Math.PI * 2;
    const pos: [number, number, number] = [around[0] + Math.cos(a) * 3.5, around[1], around[2] + Math.sin(a) * 3.5];
    await callCar(ownedIds[i], pos, a).catch(() => undefined);
  }
}

/** Where the player is standing right now (for "call the car to me"). */
export const nearPlayer = (): [number, number, number] => [playerRuntime.position.x, playerRuntime.position.y, playerRuntime.position.z];
