'use client';
import { useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { CastMember } from '../../world/kit/CastMember';
import { CHARACTERS } from '../../world/kit/characters';
import { InteractionTrigger } from '../../physics/InteractionTrigger';
import { useGameState } from '../../engine/GameState';
import { playerRuntime } from '../PlayerCharacter';

const MAMA_BISI = CHARACTERS.find((c) => c.id === 'mama_bisi')!;

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
      <CastMember def={MAMA_BISI} action={action} />
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
