'use client';
import { useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RiggedHumanoid } from '../RiggedHumanoid';
import { InteractionTrigger } from '../../physics/InteractionTrigger';
import { useGameState } from '../../engine/GameState';
import { playerRuntime } from '../PlayerCharacter';

export function InteractiveGuard({ position }: { position: [number, number, number] }) {
  const speaking = useGameState((s) => s.isDialogueActive && s.activeNpcId === 'npc_guard_academy');
  const [action, setAction] = useState<'Idle' | 'Talk' | 'Direct'>('Idle');

  useFrame(() => {
    if (speaking) {
      if (action !== 'Talk') setAction('Talk');
      return;
    }
    const dist = Math.hypot(
      playerRuntime.position.x - position[0],
      playerRuntime.position.z - position[2]
    );
    const nextAction = dist < 7.0 ? 'Direct' : 'Idle';
    if (nextAction !== action) {
      setAction(nextAction);
    }
  });

  return (
    <group position={position}>
      <RiggedHumanoid
        modelUrl="/assets/characters/guard.glb"
        actionName={action}
        fallbackShirt="#344565"
        speaking={speaking}
      />
      <InteractionTrigger
        target={{
          id: 'npc_guard_academy',
          type: 'npc',
          label: 'Academy guide',
          actionText: 'Ask the academy guide',
          position,
          radius: 2.8,
        }}
      />
    </group>
  );
}
