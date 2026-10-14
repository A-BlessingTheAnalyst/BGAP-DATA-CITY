import React from 'react';
import GameClient from './GameClient';
import { SessionValidator } from '@/server/game/SessionValidator';

export const metadata = {
  title: 'BGAP City 3D World',
  description: 'Explore the 3D city, meet characters, and investigate data challenges.',
};

export default async function GamePage() {
  // Server-side check validating user session
  const session = await SessionValidator.validateSession(null);

  return (
    <main className="w-screen h-screen overflow-hidden bg-bgap-dark relative">
      <GameClient session={session} />
    </main>
  );
}
