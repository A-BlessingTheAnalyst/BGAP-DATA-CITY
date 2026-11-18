'use client';
import { useFrame } from '@react-three/fiber';
import { useGameState } from '../engine/GameState';
import { WaypointMarker } from '../missions/WaypointMarker';
import { playerRuntime } from '../characters/PlayerCharacter';
import { AudioManager } from '../audio/AudioManager';

/** The player's own map pin in the world. It clears itself when you arrive. */
export function CustomWaypoint() {
  const pin = useGameState((s) => s.customWaypoint);
  useFrame(() => {
    if (!pin) return;
    const p = playerRuntime.position;
    if ((p.x - pin[0]) ** 2 + (p.z - pin[1]) ** 2 < 16) {
      useGameState.getState().setCustomWaypoint(null);
      AudioManager.playUi('confirm');
    }
  });
  if (!pin) return null;
  return <WaypointMarker position={[pin[0], 2.6, pin[1]]} label="Map pin" />;
}
