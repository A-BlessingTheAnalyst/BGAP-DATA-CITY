// Arcade ground-vehicle dynamics shared by owned cars (DrivableCar.tsx) and jacked street traffic
// (streetLife.tsx). Pure: no React, no three.js, no Rapier — collision is injected as a `sweep`
// callback so the same stepper is unit-tested in scripts/test-driving.ts.
//
// Model: a kinematic bicycle. The steering angle is eased toward the input and limited at speed
// (you can't full-lock at 80 km/h), and the yaw rate is v · tan(δ) / wheelbase, so turning feels
// like a car (tight at walking pace, wide at speed) instead of a constant spin rate.
// Longitudinal: throttle force tapers toward top speed, brakes are separate from reverse,
// with engine braking, rolling resistance and aerodynamic drag. Space = handbrake: bleeds speed
// fast and loosens the rear, adding yaw so you can swing the car round a junction.

export interface VehicleProfile {
  /** Forward top speed, m/s. */
  topSpeed: number;
  /** Reverse top speed, m/s. */
  reverseSpeed: number;
  /** Peak acceleration from rest, m/s². */
  accel: number;
  /** Service-brake deceleration, m/s². */
  brake: number;
  /** Axle-to-axle distance, m. */
  wheelbase: number;
  /** Full-lock steering angle at walking pace, radians. */
  maxSteer: number;
  /** How fast the wheel turns toward the input, rad/s. */
  steerRate: number;
  /** Multiplier on top speed while boost (Shift) is held. */
  boost: number;
}

const kmh = (v: number) => v / 3.6;

export const PROFILES = {
  hatchback: { topSpeed: kmh(80), reverseSpeed: kmh(22), accel: 5.2, brake: 11, wheelbase: 2.5, maxSteer: 0.6, steerRate: 2.6, boost: 1.18 },
  sedan: { topSpeed: kmh(90), reverseSpeed: kmh(22), accel: 5.6, brake: 11.5, wheelbase: 2.7, maxSteer: 0.58, steerRate: 2.5, boost: 1.2 },
  taxi: { topSpeed: kmh(85), reverseSpeed: kmh(22), accel: 5.4, brake: 11, wheelbase: 2.65, maxSteer: 0.58, steerRate: 2.5, boost: 1.18 },
  suv: { topSpeed: kmh(92), reverseSpeed: kmh(20), accel: 5.0, brake: 10.5, wheelbase: 2.85, maxSteer: 0.55, steerRate: 2.3, boost: 1.2 },
  pickup: { topSpeed: kmh(85), reverseSpeed: kmh(20), accel: 4.6, brake: 10, wheelbase: 3.1, maxSteer: 0.52, steerRate: 2.2, boost: 1.18 },
  van: { topSpeed: kmh(75), reverseSpeed: kmh(18), accel: 3.9, brake: 9, wheelbase: 3.2, maxSteer: 0.52, steerRate: 2.1, boost: 1.15 },
  danfo: { topSpeed: kmh(72), reverseSpeed: kmh(18), accel: 3.6, brake: 8.5, wheelbase: 3.4, maxSteer: 0.5, steerRate: 2.0, boost: 1.15 },
  keke: { topSpeed: kmh(48), reverseSpeed: kmh(14), accel: 3.8, brake: 8, wheelbase: 1.7, maxSteer: 0.62, steerRate: 2.8, boost: 1.12 },
  okada: { topSpeed: kmh(78), reverseSpeed: kmh(8), accel: 6.2, brake: 10, wheelbase: 1.35, maxSteer: 0.55, steerRate: 3.2, boost: 1.2 },
} satisfies Record<string, VehicleProfile>;

export type ProfileId = keyof typeof PROFILES;

/** A dealership car's profile, with its catalog top speed (m/s) applied when given. */
export function profileFor(id: string, catalogTopSpeed?: number): VehicleProfile {
  const base: VehicleProfile = PROFILES[(id in PROFILES ? id : 'sedan') as ProfileId];
  return catalogTopSpeed ? { ...base, topSpeed: catalogTopSpeed } : base;
}

export interface VehicleState {
  /** Signed forward speed, m/s (negative = reversing). */
  speed: number;
  /** Heading, radians; forward is (sin yaw, cos yaw) on x/z. */
  yaw: number;
  /** Current front-wheel angle, radians (+ = left). */
  steer: number;
}

export interface DriveInput {
  /** -1 … 1: forward is gas, backward is brake then reverse. */
  throttle: number;
  /** -1 … 1: +1 = left. */
  steer: number;
  handbrake?: boolean;
  boost?: boolean;
}

/** Moves the vehicle by (dx, dz) as far as collision allows; returns the move actually made. */
export type Sweep = (dx: number, dz: number) => { x: number; z: number };

const ROLLING = 0.35; // m/s² always opposing motion
const ENGINE_BRAKE = 1.6; // m/s² extra when off the gas
const HANDBRAKE = 9; // m/s²

/** Arcade tyre grip, m/s² of sideways acceleration (a real road car manages ~8–9). */
const GRIP = 11;

/** Steering lock left at speed v: full at a crawl, then whatever the tyres can hold
 * (tan δ ≤ grip · wheelbase / v²), so high-speed turns are wide arcs, not spins. */
export const steerLimit = (p: VehicleProfile, v: number) => Math.min(p.maxSteer, Math.atan((GRIP * p.wheelbase) / Math.max(1, v * v)));

/**
 * Advances one frame. Mutates and returns `s`, and reports the x/z move actually made
 * (after collision) so the caller can write it to the body/visual.
 */
export function stepVehicle(s: VehicleState, p: VehicleProfile, input: DriveInput, dt: number, sweep?: Sweep): { dx: number; dz: number; hit: boolean } {
  const top = p.topSpeed * (input.boost ? p.boost : 1);
  const v = s.speed;
  const throttle = Math.max(-1, Math.min(1, input.throttle));
  let a = 0;

  if (throttle > 0) {
    if (v < -0.2) a = p.brake * throttle; // rolling backward: gas brakes first
    else a = p.accel * throttle * Math.max(0, 1 - (v / top) ** 2) - (v > top ? (v - top) * 1.5 : 0);
  } else if (throttle < 0) {
    if (v > 0.2) a = p.brake * throttle; // moving forward: brake pedal
    else a = p.accel * 0.7 * throttle * Math.max(0, 1 - (v / -p.reverseSpeed) ** 2);
  } else {
    a = -Math.sign(v) * ENGINE_BRAKE;
  }
  // Rolling resistance + aero drag (the drag term is what makes the last few km/h take a while).
  a -= Math.sign(v) * (ROLLING + 0.0028 * v * v);
  if (input.handbrake) a -= Math.sign(v) * HANDBRAKE;

  let next = v + a * dt;
  // Don't let friction flip the direction of travel; you stop, then reverse needs input.
  if (Math.sign(next) !== Math.sign(v) && v !== 0 && Math.sign(throttle) !== Math.sign(next)) next = 0;
  if (Math.abs(next) < 0.05 && throttle === 0) next = 0;
  s.speed = next;

  // Steering: ease the wheel toward the input, limited by speed.
  const target = Math.max(-1, Math.min(1, input.steer)) * steerLimit(p, s.speed);
  const dSteer = target - s.steer;
  const maxStep = p.steerRate * dt * (input.steer === 0 ? 1.6 : 1); // self-centres a bit faster
  s.steer += Math.max(-maxStep, Math.min(maxStep, dSteer));

  let yawRate = (s.speed / p.wheelbase) * Math.tan(s.steer);
  // Handbrake loosens the rear: more rotation for the same wheel angle while still moving.
  if (input.handbrake && Math.abs(s.speed) > 3) yawRate *= 1.7;
  s.yaw += yawRate * dt;

  const dx = Math.sin(s.yaw) * s.speed * dt;
  const dz = Math.cos(s.yaw) * s.speed * dt;
  if (!sweep) return { dx, dz, hit: false };

  const m = sweep(dx, dz);
  const want = Math.hypot(dx, dz);
  const got = Math.hypot(m.x, m.z);
  let hit = false;
  // Only a real loss of travel counts as a collision (compare swept *lengths*, not axes: the
  // per-axis test used before treated rounding on the minor axis as a crash every frame).
  if (want > 1e-4 && got < want * 0.6) {
    hit = true;
    const kept = got / want;
    // Glancing scrape keeps most speed; a head-on stop kills it with a small bounce.
    s.speed = kept < 0.1 ? -s.speed * 0.15 : s.speed * (0.4 + 0.6 * kept);
  }
  return { dx: m.x, dz: m.z, hit };
}

/** Smooths digital keys (0/1) into an analog axis, so steering doesn't snap. */
export function easeAxis(current: number, target: number, dt: number, rate = 6): number {
  const step = rate * dt;
  return current + Math.max(-step, Math.min(step, target - current));
}
