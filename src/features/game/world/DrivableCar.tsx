'use client';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider, RapierRigidBody, useRapier } from '@react-three/rapier';
import { Group, MathUtils } from 'three';
import { useGameState } from '../engine/GameState';
import { InteractionTrigger } from '../physics/InteractionTrigger';
import { Car, Tricycle, Chopper } from './kit/vehicles';
import { CastMember } from './kit/CastMember';
import { usePlayerDef } from '../ui/wardrobe/useWardrobe';
import { runtimeInput } from '../input/InputManager';
import { driveRuntime, playerRuntime } from '../characters/PlayerCharacter';
import { callCar, useGarage } from '../ui/garage/useGarage';
import { CITY_BOUNDS } from './kit/cityPlan';
import { stepVehicle, profileFor, type VehicleState } from './vehicleDynamics';
import { readDriveInput } from '../input/driveInput';
import type { OwnedVehicle, VehicleDef } from '@/shared/types/garage';

/** Rough box footprint per body style, matching the kit models closely enough for collision. */
const FOOTPRINT: Record<VehicleDef['body'], [number, number, number]> = {
  hatchback: [1.8, 1.6, 3.9], sedan: [1.8, 1.6, 4.5], taxi: [1.8, 1.7, 4.4],
  suv: [2, 2, 4.7], pickup: [1.9, 2, 5.2], keke: [1.4, 2.2, 2.4], chopper: [2.1, 2.5, 4.6],
};
// Phase F: the chopper is a floaty hover model, not a ray-cast ground controller — it free-flies
// with an altitude clamp and the city bounds, but (unlike ground vehicles) no collision against
// buildings. That full 3D obstacle-avoidance is out of scope for this pass; see masterprompt.md.
const FLIGHT_CEILING = 140, FLIGHT_FLOOR = 1.4, VERTICAL_RATE = 9, FLIGHT_TURN = 1.6;

/** A vehicle the player owns, parked where the garage/server says. Drive/fly it with E, WASD, exit with E. */
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
  const hasLicence = useGarage((s) => (def.licence === 'flight' ? s.hasFlightLicence : s.hasLicence));
  const isChopper = def.body === 'chopper';
  const playerDef = usePlayerDef();
  const profile = profileFor(def.body, def.maxSpeed);
  const dyn = useRef<VehicleState>({ speed: 0, yaw: owned.rotationY, steer: 0 });

  useEffect(() => {
    const c = world.createCharacterController(0.02);
    controller.current = c;
    return () => { world.removeCharacterController(c); controller.current = undefined; };
  }, [world]);

  // Re-sync from the server's last known position/rotation whenever this vehicle is (re)called or bought.
  useEffect(() => {
    pos.current = owned.position;
    yaw.current = owned.rotationY;
    speed.current = 0;
    body.current?.setNextKinematicTranslation({ x: owned.position[0], y: owned.position[1], z: owned.position[2] });
  }, [owned.position[0], owned.position[1], owned.position[2], owned.rotationY]);

  useFrame((_, dt) => {
    if (!body.current || !controller.current) return;
    const delta = Math.min(dt, 0.1);
    const [x0, y0, z0] = pos.current;

    if (isMine && isChopper) {
      // Free flight: W/S thrust, A/D yaw (can turn on the spot), Space climbs, Shift descends.
      const throttle = (runtimeInput.forward ? 1 : 0) - (runtimeInput.backward ? 1 : 0);
      const steer = MathUtils.clamp((runtimeInput.left ? 1 : 0) - (runtimeInput.right ? 1 : 0) - runtimeInput.axisX, -1, 1);
      const vertical = (runtimeInput.jump ? 1 : 0) - (runtimeInput.sprint ? 1 : 0);
      const maxSpeed = def.maxSpeed;
      speed.current = MathUtils.damp(speed.current, throttle * maxSpeed, 4, delta);
      yaw.current += steer * FLIGHT_TURN * delta;
      const B = CITY_BOUNDS, m = 2;
      const nx = MathUtils.clamp(x0 + Math.sin(yaw.current) * speed.current * delta, B.minX + m, B.maxX - m);
      const nz = MathUtils.clamp(z0 + Math.cos(yaw.current) * speed.current * delta, B.minZ + m, B.maxZ - m);
      const ny = MathUtils.clamp(y0 + vertical * VERTICAL_RATE * delta, FLIGHT_FLOOR, FLIGHT_CEILING);
      pos.current = [nx, ny, nz];
      body.current.setNextKinematicTranslation({ x: nx, y: ny, z: nz });
      driveRuntime.position.set(nx, ny + 0.4, nz);
      driveRuntime.rotationY = yaw.current;
      driveRuntime.speed = speed.current;
      driveRuntime.steer = 0;
    } else if (isMine) {
      // Real-feel arcade car (world/vehicleDynamics.ts): speed-sensitive steering, separate
      // brake/reverse, drag, handbrake. The car stays on the road (y never drifts upward: the
      // old `max(y, h/2)` floated every driven car ~0.8 m above the street).
      const st = dyn.current;
      st.yaw = yaw.current;
      st.speed = speed.current;
      const ctrl = controller.current, rb = body.current;
      const res = stepVehicle(st, profile, readDriveInput(delta), delta, (dx, dz) => {
        ctrl.computeColliderMovement(rb.collider(0), { x: dx, y: 0, z: dz });
        const m = ctrl.computedMovement();
        return { x: m.x, z: m.z };
      });
      speed.current = st.speed;
      yaw.current = st.yaw;
      const B = CITY_BOUNDS, mg = 2;
      pos.current = [MathUtils.clamp(x0 + res.dx, B.minX + mg, B.maxX - mg), y0, MathUtils.clamp(z0 + res.dz, B.minZ + mg, B.maxZ - mg)];
      rb.setNextKinematicTranslation({ x: pos.current[0], y: pos.current[1], z: pos.current[2] });
      // The collision box turns with the car (it used to stay axis-aligned whatever the heading).
      const half = yaw.current / 2;
      rb.setNextKinematicRotation({ x: 0, y: Math.sin(half), z: 0, w: Math.cos(half) });
      driveRuntime.position.set(pos.current[0], pos.current[1] + 0.9, pos.current[2]);
      driveRuntime.rotationY = yaw.current;
      driveRuntime.speed = speed.current;
      driveRuntime.steer = st.steer;
    }

    if (visual.current) { visual.current.position.set(...pos.current); visual.current.rotation.y = yaw.current; }
  });

  const verb = isChopper ? 'Fly' : 'Enter';
  const licenceName = def.licence === 'flight' ? 'flight test' : 'driving test';
  const enterTarget = { id: `vehicle:${def.id}`, type: 'vehicle' as const, label: def.name, actionText: hasLicence ? `${verb} ${def.name} [E]` : `${def.name} — pass your ${licenceName} first`, position: pos.current, radius: 2.4 };
  const [w, h, len] = FOOTPRINT[def.body];

  return (
    <>
      <RigidBody ref={body} type="kinematicPosition" colliders={false} position={owned.position} enabledRotations={[false, false, false]}>
        {/* Lifted a little so the box never scrapes the road and reads the ground as a wall. */}
        <CuboidCollider args={[w / 2, h / 2 - 0.1, len / 2]} position={[0, h / 2 + 0.1, 0]} sensor={isChopper} />
      </RigidBody>
      <group ref={visual} position={owned.position} rotation={[0, owned.rotationY, 0]}>
        {def.body === 'keke' ? <Tricycle color={def.color} /> : def.body === 'chopper' ? <Chopper color={def.color} flying={isMine} /> : <Car body={def.body} color={def.color} />}
        {/* A visible driver whenever this car is yours and occupied (Owner feedback 18 Nov 2026,
            masterprompt.md §12.2 — drivers were invisible before). The "Driving_Loop" clip should
            already bend the pelvis down into a seated pose; this anchor is deliberately low and
            conservative (owner feedback 19 Nov 2026: the ambient Person driver was floating near
            the roofline at a similar height-scaled offset) and still needs a live look to tune. */}
        {isMine && (
          <group position={[def.body === 'keke' ? 0 : -0.3, isChopper ? 0.35 : 0.15, isChopper ? 0.2 : 0.1]} scale={0.95}>
            <CastMember def={playerDef} action="Drive" />
          </group>
        )}
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
