import { InputState } from './InputManager';

export function bindKeyboardListeners(
  inputState: InputState,
  onInteractTrigger: () => void
): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement;
    if (el.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        inputState.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        inputState.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        inputState.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        inputState.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        inputState.sprint = true;
        break;
      case 'KeyE':
        inputState.interact = true;
        if (!e.repeat) onInteractTrigger();
        break;
      case 'Space':
        inputState.jump = true;
        break;
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        inputState.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        inputState.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        inputState.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        inputState.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        inputState.sprint = false;
        break;
      case 'KeyE':
        inputState.interact = false;
        break;
      case 'Space':
        inputState.jump = false;
        break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
}
