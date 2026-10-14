import { useEffect } from 'react';
import { runtimeInput, resetInput } from './InputManager';
import { bindKeyboardListeners } from './KeyboardControls';
import { useGameState } from '../engine/GameState';
export function interact() {
 const s = useGameState.getState();
 if (!s.activeTarget || s.isPaused || s.isDialogueActive || s.isWorkstationActive) return;
 s.setCameraMode(s.activeTarget.type === 'npc' ? 'conversation' : 'interaction', s.activeTarget.position);
 if (s.activeTarget.type === 'npc') s.openDialogue(s.activeTarget.id);
 else if (s.activeTarget.type === 'workstation' && s.missionState !== 'available') s.openWorkstation(s.activeTarget.id);
 resetInput();
}
export function useInput() {
 useEffect(() => {
  const unbind = bindKeyboardListeners(runtimeInput, interact);
  const clear = () => resetInput();
  window.addEventListener('blur', clear); document.addEventListener('visibilitychange', clear);
  return () => { unbind(); window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', clear); resetInput(); };
 }, []);
 return runtimeInput;
}
