"use client";

import dynamic from 'next/dynamic';
import React from 'react';
import { AuthSession } from '@/server/game/SessionValidator';

// Lazily import the 3D Game World with SSR disabled
const GameWorld = dynamic(() => import('./GameWorld'), {
  ssr: false,
  loading: () => (
    <div className="w-screen h-screen bg-bgap-dark flex flex-col items-center justify-center text-center p-6 select-none">
      <div className="w-16 h-16 rounded-2xl bg-bgap-cyan/10 border border-bgap-cyan/40 flex items-center justify-center mb-6 animate-pulse">
        <span className="w-8 h-8 rounded-full border-2 border-bgap-cyan border-t-transparent animate-spin" />
      </div>
      <h2 className="text-xl font-bold text-bgap-text mb-2">Preparing BGAP City...</h2>
      <p className="text-xs text-bgap-muted font-mono max-w-sm leading-relaxed">
        Streaming city districts, compiling shaders, and initializing physics engine.
      </p>
    </div>
  ),
});

interface Props {
  session: AuthSession;
}

export default function GameClient({ session }: Props) {
  return <GameWorld session={session} />;
}
