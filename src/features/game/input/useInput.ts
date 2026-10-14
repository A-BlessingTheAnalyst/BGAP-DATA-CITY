import { useEffect, useRef } from 'react';
import { InputState, initialInputState } from './InputManager';
import { bindKeyboardListeners } from './KeyboardControls';
import { useGameState } from '../engine/GameState';

export function useInput() {
  const inputRef = useRef<InputState>({ ...initialInputState });
  const activeTarget = useGameState((s) => s.activeTarget);
  const openDialogue = useGameState((s) => s.openDialogue);
  const openWorkstation = useGameState((s) => s.openWorkstation);

  useEffect(() => {
    const unbind = bindKeyboardListeners(inputRef.current, () => {
      if (!activeTarget) return;
      if (activeTarget.type === 'npc') {
        openDialogue(activeTarget.id);
      } else if (activeTarget.type === 'workstation') {
        openWorkstation(activeTarget.id);
      }
    });

    return () => unbind();
  }, [activeTarget, openDialogue, openWorkstation]);

  return inputRef.current;
}
