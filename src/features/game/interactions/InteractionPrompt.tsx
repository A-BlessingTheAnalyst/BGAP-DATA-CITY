"use client";

import React from 'react';
import { useGameState } from '../engine/GameState';

export const InteractionPrompt: React.FC = () => {
  const activeTarget = useGameState((s) => s.activeTarget);
  const isDialogueActive = useGameState((s) => s.isDialogueActive);
  const isWorkstationActive = useGameState((s) => s.isWorkstationActive);

  if (!activeTarget || isDialogueActive || isWorkstationActive) return null;

  return (
    <div className="absolute bottom-28 inset-x-0 flex justify-center pointer-events-none select-none z-20">
      <div className="bg-bgap-surface/90 border border-bgap-cyan/60 backdrop-blur-md px-5 py-2.5 rounded-full shadow-neon-cyan flex items-center gap-3 animate-bounce">
        <span className="w-6 h-6 rounded-md bg-bgap-cyan text-bgap-dark font-bold font-mono text-sm flex items-center justify-center">
          E
        </span>
        <span className="text-sm font-semibold text-bgap-text">{activeTarget.actionText}</span>
      </div>
    </div>
  );
};
