import React from 'react';
import GameClient from './GameClient';
import { SessionValidator } from '@/server/game/SessionValidator';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'BGAP City 3D World',
  description: 'Explore the 3D city, meet characters, and investigate data challenges.',
};

export default async function GamePage() {
  let session;
  try {
    session = await SessionValidator.validateSession(null);
  } catch (err) {
    session = {
      userId: 'dev-cadet-analyst',
      email: 'cadet@aidlearn.org',
      role: 'student' as const,
    };
  }

  return (
    <main className="w-screen h-screen overflow-hidden bg-bgap-dark relative">
      <GameClient session={session} />
    </main>
  );
}
