"use client";

import React, { useState } from 'react';
import { useGameState } from '../engine/GameState';

export const MobileTouchControls: React.FC = () => {
  const activeTarget = useGameState((s) => s.activeTarget);
  const openDialogue = useGameState((s) => s.openDialogue);
  const openWorkstation = useGameState((s) => s.openWorkstation);
  const [touchActive, setTouchActive] = useState(false);

  const handleAction = () => {
    if (!activeTarget) return;
    if (activeTarget.type === 'npc') openDialogue(activeTarget.id);
    if (activeTarget.type === 'workstation') openWorkstation(activeTarget.id);
  };

  return (
    <div className="md:hidden pointer-events-auto absolute inset-x-0 bottom-6 px-6 flex justify-between items-end z-30">
      {/* Virtual Joystick Base */}
      <div
        className="w-28 h-28 rounded-full bg-bgap-card/60 backdrop-blur-md border border-bgap-border flex items-center justify-center touch-none"
        onTouchStart={() => setTouchActive(true)}
        onTouchEnd={() => setTouchActive(false)}
      >
        <div
          className={`w-12 h-12 rounded-full bg-bgap-cyan/80 transition-transform ${
            touchActive ? 'scale-110 shadow-neon-cyan' : ''
          }`}
        />
      </div>

      {/* Action / Interact Button */}
      {activeTarget && (
        <button
          onClick={handleAction}
          className="h-16 px-6 rounded-2xl bg-gradient-to-r from-bgap-cyan to-bgap-emerald text-bgap-dark font-bold text-lg shadow-neon-cyan flex items-center gap-2 active:scale-95"
        >
          <span>INTERACT</span>
        </button>
      )}
    </div>
  );
};
