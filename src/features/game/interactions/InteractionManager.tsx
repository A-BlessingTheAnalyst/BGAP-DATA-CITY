"use client";

import React from 'react';
import { InteractionPrompt } from './InteractionPrompt';
import { DialogueBox } from './DialogueBox';
import { AnalyticsTerminalModal } from '../../analysis/sql-editor/AnalyticsTerminalModal';
import { useGameState } from '../engine/GameState';

export const InteractionManager: React.FC = () => {
  const isDialogueActive = useGameState((s) => s.isDialogueActive);
  const isWorkstationActive = useGameState((s) => s.isWorkstationActive);

  return (
    <>
      {/* Floating 2D Proximity Interaction Prompt */}
      <InteractionPrompt />

      {/* Cinematic Dialogue Modal */}
      {isDialogueActive && <DialogueBox />}

      {/* Analytics Terminal Overlay */}
      {isWorkstationActive && <AnalyticsTerminalModal />}
    </>
  );
};
