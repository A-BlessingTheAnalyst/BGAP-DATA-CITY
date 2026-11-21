"use client";

import React from 'react';
import { useGameState } from '../engine/GameState';
import { useIsTouch } from '../ui/hudPrefs';

/** "E · Talk to Mama Titi": a small, still pill low on the screen. On touch devices the action
 * button itself carries this label, so nothing extra is drawn over the scene. */
export const InteractionPrompt: React.FC = () => {
  const activeTarget = useGameState((s) => s.activeTarget);
  const isDialogueActive = useGameState((s) => s.isDialogueActive);
  const isWorkstationActive = useGameState((s) => s.isWorkstationActive);
  const reading = useGameState((s) => s.openEvidence !== null);
  const touch = useIsTouch();

  if (touch || !activeTarget || isDialogueActive || isWorkstationActive || reading) return null;

  return (
    <div className="absolute bottom-20 inset-x-0 flex justify-center pointer-events-none select-none z-20">
      <div className="bg-bgap-surface/90 border border-bgap-cyan/50 backdrop-blur-md pl-1.5 pr-3.5 py-1.5 rounded-full shadow-hud-glass flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-bgap-cyan text-bgap-dark font-bold font-mono text-xs flex items-center justify-center">E</span>
        <span className="text-xs font-semibold text-bgap-text">{activeTarget.actionText.replace(/\s*\[E\]\s*$/, '')}</span>
      </div>
    </div>
  );
};
