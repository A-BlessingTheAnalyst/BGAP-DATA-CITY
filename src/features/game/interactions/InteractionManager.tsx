"use client";

import React, { useEffect } from 'react';
import { InteractionPrompt } from './InteractionPrompt';
import { DialogueBox } from './DialogueBox';
import { AnalyticsTerminalModal } from '../../analysis/sql-editor/AnalyticsTerminalModal';
import { useGameState } from '../engine/GameState';
import { interactionTargets } from '../physics/InteractionTrigger';
import { playerRuntime } from '../characters/PlayerCharacter';
import { InteractionTarget } from '@/shared/types/game';

export const InteractionManager: React.FC = () => {
  const isDialogueActive = useGameState((s) => s.isDialogueActive);
  const isWorkstationActive = useGameState((s) => s.isWorkstationActive);
  const isPaused = useGameState((s) => s.isPaused);
  const setActiveTarget = useGameState((s) => s.setActiveTarget);

  // Central proximity evaluator loop: evaluates nearest eligible target without trigger contention
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDialogueActive || isWorkstationActive || isPaused) {
        return;
      }

      const p = playerRuntime.position;
      let closest: InteractionTarget | null = null;
      let minDist = Infinity;

      interactionTargets.forEach((target) => {
        const dx = p.x - target.position[0];
        const dy = p.y - target.position[1];
        const dz = p.z - target.position[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist <= target.radius && dist < minDist) {
          minDist = dist;
          closest = target;
        }
      });

      const current = useGameState.getState().activeTarget;
      const closestId = closest ? (closest as any).id : null; const currentId = current ? current.id : null; if (closestId !== currentId) {
        setActiveTarget(closest);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isDialogueActive, isWorkstationActive, isPaused, setActiveTarget]);

  return (
    <>
      <InteractionPrompt />
      {isDialogueActive && <DialogueBox />}
      {isWorkstationActive && <AnalyticsTerminalModal />}
    </>
  );
};
