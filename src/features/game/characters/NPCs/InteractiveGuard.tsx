'use client';
import { useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { CastMember } from '../../world/kit/CastMember';
import { CHARACTERS } from '../../world/kit/characters';
import { InteractionTrigger } from '../../physics/InteractionTrigger';
import { useGameState } from '../../engine/GameState';
import { playerRuntime } from '../PlayerCharacter';

const TUNDE = CHARACTERS.find((c) => c.id === 'officer_tunde')!;

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
      <CastMember def={TUNDE} action={action} />
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
