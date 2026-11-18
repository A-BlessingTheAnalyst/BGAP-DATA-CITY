'use client';
import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, RapierRigidBody, useRapier } from '@react-three/rapier';
import { Group, Vector3, MathUtils } from 'three';
import { useGameState } from '../engine/GameState';
import { useInput } from '../input/useInput';
import { CastMember } from '../world/kit/CastMember';
import { usePlayerDef, useWardrobe } from '../ui/wardrobe/useWardrobe';
import { AudioManager } from '../audio/AudioManager';
import { MARKET_LAYOUT } from '@/shared/constants/marketLayout';
import { CITY_BOUNDS } from '../world/kit/cityPlan';

const [SX, SY, SZ] = MARKET_LAYOUT.spawn;

export const playerRuntime = { position: new Vector3(SX, SY, SZ), rotation: 0, speed: 0 };

export function PlayerCharacter() {
  const body = useRef<RapierRigidBody>(null), visual = useRef<Group>(null);
  const { world } = useRapier();
  const controller = useRef<ReturnType<typeof world.createCharacterController>>();
  const input = useInput(), velocity = useRef(new Vector3()), elapsed = useRef(0), stepClock = useRef(0);
  const [animAction, setAnimAction] = useState<'Idle' | 'Run' | 'Sprint' | 'Type'>('Idle');
  const player = usePlayerDef();

  // Development-only play-test handle: read the player position or teleport (x, z) from the console.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const w = window as unknown as { __player?: unknown };
    w.__player = {
      runtime: playerRuntime,
      teleport: (x: number, z: number) => body.current?.setNextKinematicTranslation({ x, y: SY, z }),
    };
    return () => { delete w.__player; };
  }, []);

  useEffect(() => {
    const c = world.createCharacterController(0.02);
    c.enableAutostep(0.3, 0.2, true);
    c.enableSnapToGround(0.3);
    c.setMaxSlopeClimbAngle(Math.PI / 4);
    controller.current = c;
    return () => {
      world.removeCharacterController(c);
      controller.current = undefined;
    };
  }, [world]);

  useFrame((_, dt) => {
    if (!body.current || !controller.current) return;
    const delta = Math.min(dt, 0.04), s = useGameState.getState();
    // Frozen while any full-screen UI is up, including the character creator before first spawn.
    const w = useWardrobe.getState();
    const blocked = s.isPaused || s.isDialogueActive || s.isWorkstationActive || s.isMapOpen || s.isCreatorOpen || s.isShopOpen || (w.loaded && !w.profile);
    let x = blocked ? 0 : Number(input.right) - Number(input.left) + input.axisX;
    let z = blocked ? 0 : Number(input.backward) - Number(input.forward) + input.axisZ;
    const length = Math.max(1, Math.hypot(x, z));
    x /= length;
    z /= length;
    const speed = input.sprint ? 7 : 4, sin = Math.sin(input.yaw), cos = Math.cos(input.yaw);
    velocity.current.x = blocked ? 0 : MathUtils.damp(velocity.current.x, (x * cos + z * sin) * speed, 12, delta);
    velocity.current.z = blocked ? 0 : MathUtils.damp(velocity.current.z, (z * cos - x * sin) * speed, 12, delta);
    velocity.current.y = controller.current.computedGrounded() ? -0.5 : Math.max(-20, velocity.current.y - 9.81 * delta);
    controller.current.computeColliderMovement(body.current.collider(0), {
      x: velocity.current.x * delta,
      y: velocity.current.y * delta,
      z: velocity.current.z * delta,
    });
    const movement = controller.current.computedMovement(), p = body.current.translation();
    // Perimeter walls keep you in; the clamp is a backstop. Only a fall through the world respawns.
    const B = CITY_BOUNDS, m = 1.5;
    body.current.setNextKinematicTranslation(
      p.y < -10
        ? { x: SX, y: SY, z: SZ }
        : { x: MathUtils.clamp(p.x + movement.x, B.minX + m, B.maxX - m), y: p.y + movement.y, z: MathUtils.clamp(p.z + movement.z, B.minZ + m, B.maxZ - m) }
    );
    playerRuntime.position.set(p.x, p.y, p.z);
    playerRuntime.speed = Math.hypot(movement.x, movement.z) / delta;

    if (playerRuntime.speed > 0.1 && visual.current) {
      const target = Math.atan2(velocity.current.x, velocity.current.z);
      const diff = Math.atan2(Math.sin(target - visual.current.rotation.y), Math.cos(target - visual.current.rotation.y));
      visual.current.rotation.y += diff * (1 - Math.exp(-12 * delta));
      playerRuntime.rotation = visual.current.rotation.y;
    }

    // Default movement (4 m/s) is a jog; holding sprint (7 m/s) plays the sprint clip.
    let nextAnim: 'Idle' | 'Run' | 'Sprint' | 'Type' = 'Idle';
    if (s.isWorkstationActive) {
      nextAnim = 'Type';
    } else if (playerRuntime.speed > 5.2) {
      nextAnim = 'Sprint';
    } else if (playerRuntime.speed > 0.2) {
      nextAnim = 'Run';
    } else {
      nextAnim = 'Idle';
    }
    // Footsteps paced to gait: faster cadence when sprinting.
    if (nextAnim === 'Run' || nextAnim === 'Sprint') {
      stepClock.current += delta;
      const interval = nextAnim === 'Sprint' ? 0.27 : 0.34;
      if (stepClock.current >= interval) {
        stepClock.current = 0;
        AudioManager.playFootstep(nextAnim === 'Sprint');
      }
    } else {
      stepClock.current = 0.3;
    }

    if (nextAnim !== animAction) {
      setAnimAction(nextAnim);
    }

    elapsed.current += delta;
    if (elapsed.current > 0.1) {
      s.setPlayerTransform([p.x, p.y, p.z], playerRuntime.rotation);
      elapsed.current = 0;
    }
  });

  return (
    <RigidBody ref={body} type="kinematicPosition" colliders={false} position={MARKET_LAYOUT.spawn} enabledRotations={[false, false, false]}>
      <CapsuleCollider args={[0.55, 0.32]} />
      <group ref={visual} position={[0, -0.87, 0]}>
        <CastMember def={player} action={animAction} />
      </group>
    </RigidBody>
  );
}
