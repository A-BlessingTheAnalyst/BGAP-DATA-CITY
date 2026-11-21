import { runtimeInput } from './InputManager';
import { easeAxis, type DriveInput } from '../world/vehicleDynamics';

// One place that turns raw controls (keyboard booleans, the touch stick's analog x, touch pedals)
// into a smooth DriveInput for whichever vehicle the player is in.

let steerSmoothed = 0;

/** Call once per frame while driving. */
export function readDriveInput(dt: number): DriveInput {
  const keys = (runtimeInput.left ? 1 : 0) - (runtimeInput.right ? 1 : 0);
  // Touch stick: x is analog (right = +), so steering left is −axisX. It's already analog, so it
  // applies directly; keyboard steering is eased so a tap is a nudge and a hold is full lock.
  const stick = -runtimeInput.axisX;
  steerSmoothed = Math.abs(stick) > 0.05 ? stick : easeAxis(steerSmoothed, keys, dt, 4.5);
  const throttle = (runtimeInput.forward ? 1 : 0) - (runtimeInput.backward ? 1 : 0);
  return {
    throttle,
    steer: Math.max(-1, Math.min(1, steerSmoothed)),
    handbrake: runtimeInput.jump,
    boost: runtimeInput.sprint,
  };
}

export function resetDriveInput() { steerSmoothed = 0; }
