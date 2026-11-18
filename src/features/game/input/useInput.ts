import { useEffect } from 'react';
import { runtimeInput, resetInput } from './InputManager';
import { bindKeyboardListeners } from './KeyboardControls';
import { useGameState } from '../engine/GameState';
import { AudioManager } from '../audio/AudioManager';
export function interact() {
 const s = useGameState.getState();
 if (!s.activeTarget || s.isPaused || s.isDialogueActive || s.isWorkstationActive || s.isShopOpen || s.isCreatorOpen) return;
 AudioManager.playUi('open');
 if (s.activeTarget.type === 'shop') {
  s.setShopOpen(true);
  resetInput();
  return;
 }
 if (s.activeTarget.type === 'evidence') {
  // id is "evidence:<missionId>:<evidenceId>"; reading it doesn't move the camera.
  const [, missionId, evidenceId] = s.activeTarget.id.split(':');
  s.pickUpEvidence(missionId, evidenceId);
  resetInput();
  return;
 }
 s.setCameraMode(s.activeTarget.type === 'npc' ? 'conversation' : 'interaction', s.activeTarget.position);
 if (s.activeTarget.type === 'npc') s.openDialogue(s.activeTarget.id);
 else if (s.activeTarget.type === 'workstation' && (s.activeTarget.id.startsWith('ws:') || s.missionState !== 'available')) s.openWorkstation(s.activeTarget.id);
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
