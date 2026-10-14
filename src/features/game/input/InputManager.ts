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
