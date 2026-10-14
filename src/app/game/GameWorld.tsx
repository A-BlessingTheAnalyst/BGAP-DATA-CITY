"use client";

import React, { useEffect } from 'react';
import { GameCanvas } from '@/features/game/engine/GameCanvas';
import { GameHUD } from '@/features/game/ui/GameHUD';
import { InteractionManager } from '@/features/game/interactions/InteractionManager';
import { FallbackView } from '@/features/game/ui/FallbackView';
import { useGameEngine } from '@/features/game/engine/useGameEngine';
import { AuthSession } from '@/server/game/SessionValidator';

interface Props {
  session: AuthSession;
}

export default function GameWorld({ session }: Props) {
  const { isReady, hasWebGL } = useGameEngine();

  useEffect(() => {
    console.log('[GAME] Initialized with session for user:', session.userId);
  }, [session]);

  if (!isReady) return null;
  if (!hasWebGL) return <FallbackView />;

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* 3D WebGL Canvas Layer */}
      <GameCanvas />

      {/* 2D HTML/React HUD Overlay */}
      <GameHUD />

      {/* Dialogue & Analytics Terminal Interactions */}
      <InteractionManager />
    </div>
  );
}
