export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  sprint: boolean;
  interact: boolean;
  jump: boolean;
}

export const initialInputState: InputState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
  interact: false,
  jump: false,
};

export const runtimeInput = { ...initialInputState, axisX: 0, axisZ: 0, yaw: 0, pitch: 0.35 };
export function resetInput() { Object.assign(runtimeInput, initialInputState, { axisX: 0, axisZ: 0 }); }
