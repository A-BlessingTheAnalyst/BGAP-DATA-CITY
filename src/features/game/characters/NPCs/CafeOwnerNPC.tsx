'use client';
import { useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RiggedHumanoid } from '../RiggedHumanoid';
import { InteractionTrigger } from '../../physics/InteractionTrigger';
import { useGameState } from '../../engine/GameState';
import { playerRuntime } from '../PlayerCharacter';

export function CafeOwnerNPC({ position }: { position: [number, number, number] }) {
  const speaking = useGameState((s) => s.isDialogueActive && s.activeNpcId === 'npc_mama_bisi');
  const [action, setAction] = useState<'Idle' | 'Talk' | 'Wave'>('Idle');

  useFrame(() => {
    if (speaking) {
      if (action !== 'Talk') setAction('Talk');
      return;
    }
    const dist = Math.hypot(
      playerRuntime.position.x - position[0],
      playerRuntime.position.z - position[2]
    );
    const nextAction = dist < 6.0 ? 'Wave' : 'Idle';
    if (nextAction !== action) {
      setAction(nextAction);
    }
  });

  return (
    <group position={position}>
      <RiggedHumanoid
        modelUrl="/assets/characters/mama_bisi.glb"
        actionName={action}
        fallbackShirt="#c58137"
        fallbackSkin="#7c482f"
        speaking={speaking}
      />
      <InteractionTrigger
        target={{
          id: 'npc_mama_bisi',
          type: 'npc',
          label: 'Mama Bisi',
          actionText: 'Speak with Mama Bisi',
          position,
          radius: 2.8,
        }}
      />
    </group>
  );
}
