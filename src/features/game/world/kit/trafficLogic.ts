// Pure traffic-light and driver-reaction logic (Phase C). No React/three/rapier here, so it can be
// unit-tested directly (scripts/test-traffic.ts) and shared between the renderer and the tests.

export type SignalPhase = 'green' | 'yellow' | 'red';

/** Seconds: each axis gets `green`, then `yellow`, before the other axis gets its turn. */
export const LIGHT_TIMING = { green: 9, yellow: 2 };
export const LIGHT_PERIOD = (LIGHT_TIMING.green + LIGHT_TIMING.yellow) * 2;

/**
 * The signal state for roads running along `axis` at time `t` (seconds), offset per intersection
 * so not every junction in the city switches in lockstep.
 */
export function signalPhase(t: number, axis: 'x' | 'z', offset = 0): SignalPhase {
  const local = (((t + offset) % LIGHT_PERIOD) + LIGHT_PERIOD) % LIGHT_PERIOD;
  const { green, yellow } = LIGHT_TIMING;
  const zGreenEnd = green, zYellowEnd = zGreenEnd + yellow;
  const xGreenStart = zYellowEnd, xGreenEnd = xGreenStart + green, xYellowEnd = xGreenEnd + yellow;
  if (axis === 'z') {
    if (local < zGreenEnd) return 'green';
    if (local < zYellowEnd) return 'yellow';
    return 'red';
  }
  if (local >= xGreenStart && local < xGreenEnd) return 'green';
  if (local >= xGreenEnd && local < xYellowEnd) return 'yellow';
  return 'red';
}

/**
 * How much of their speed a vehicle keeps (0 = stopped, 1 = full speed) given the light `phase`
 * and its distance to the stop line (negative/zero = already past it, so never clamped).
 */
export function signalBrakeFactor(phase: SignalPhase, distToStopLine: number): number {
  if (distToStopLine <= 0) return 1;
  if (phase === 'green') return 1;
  if (phase === 'yellow' && distToStopLine < 4) return 1; // too close to stop safely: go through
  return Math.max(0, Math.min(1, (distToStopLine - 1.2) / 10));
}

/** Is the player standing close enough, ahead of a vehicle travelling in direction (dirx, dirz), to block it? */
export function isBlockedByPlayer(vx: number, vz: number, dirx: number, dirz: number, px: number, pz: number, aheadMax = 6, sideMax = 2.2): boolean {
  const dx = px - vx, dz = pz - vz;
  const ahead = dx * dirx + dz * dirz;
  const side = Math.abs(dx * dirz - dz * dirx);
  return ahead > 0 && ahead < aheadMax && side < sideMax;
}

export type BlockPhase = 'none' | 'brake' | 'horn' | 'shout' | 'push';
export interface BlockState { phase: BlockPhase; timer: number }

/** Seconds of being blocked before each escalation (masterprompt §11 Phase C table). */
export const BLOCK_THRESHOLDS: Record<Exclude<BlockPhase, 'none'>, number> = { brake: 0, horn: 1.5, shout: 4, push: 9 };

/** Advances one vehicle's "blocked by the player" state machine by `dt` seconds. Pure: no side effects. */
export function stepBlockState(state: BlockState, blocked: boolean, dt: number): BlockState {
  if (!blocked) return { phase: 'none', timer: 0 };
  const timer = state.timer + Math.max(0, dt);
  let phase: BlockPhase = 'brake';
  if (timer >= BLOCK_THRESHOLDS.push) phase = 'push';
  else if (timer >= BLOCK_THRESHOLDS.shout) phase = 'shout';
  else if (timer >= BLOCK_THRESHOLDS.horn) phase = 'horn';
  return { phase, timer };
}
