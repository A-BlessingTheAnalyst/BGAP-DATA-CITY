import { useEffect } from 'react';
import { runtimeInput, resetInput } from './InputManager';
import { bindKeyboardListeners } from './KeyboardControls';
import { useGameState } from '../engine/GameState';
import { AudioManager } from '../audio/AudioManager';
import { useGarage } from '../ui/garage/useGarage';
import { driveRuntime, requestTeleport } from '../characters/PlayerCharacter';
export function interact() {
 const s = useGameState.getState();
 // E always gets out of the car first, regardless of what's nearby. Step out to the right side
 // of the vehicle rather than straight into its own collider.
 if (s.isDriving) {
  const yaw = driveRuntime.rotationY;
  requestTeleport(driveRuntime.position.x + Math.cos(yaw) * 2.2, driveRuntime.position.z - Math.sin(yaw) * 2.2);
  s.setDriving(null);
  AudioManager.playUi('close'); resetInput(); return;
 }
 if (!s.activeTarget || s.isPaused || s.isDialogueActive || s.isWorkstationActive || s.isShopOpen || s.isCreatorOpen) return;
 AudioManager.playUi('open');
 if (s.activeTarget.type === 'vehicle') {
  const vehicleId = s.activeTarget.id.slice('vehicle:'.length);
  // Jacking an ambient street vehicle ("vehicle:traffic:<i>") is a quick, informal ride — it
  // needs no licence (owning and registering a car from the dealership still does). Owner
  // feedback 19 Nov 2026: the ₦200,000 driving-test paywall made jacking look broken, since a
  // fresh account can't afford it and nothing visibly happened beyond a quiet error sound.
  if (vehicleId.startsWith('traffic:')) { s.setDriving(vehicleId); resetInput(); return; }
  const g = useGarage.getState();
  const def = g.catalog.find((v) => v.id === vehicleId);
  const ok = def?.licence === 'flight' ? g.hasFlightLicence : g.hasLicence;
  if (!ok) { AudioManager.playUi('error'); resetInput(); return; }
  s.setDriving(vehicleId);
  resetInput();
  return;
 }
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
