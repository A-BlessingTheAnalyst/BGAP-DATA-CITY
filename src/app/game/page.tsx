import React from 'react';
import GameClient from './GameClient';
import { redirect } from 'next/navigation';
import { SessionValidator } from '@/server/game/SessionValidator';

export const dynamic = 'force-dynamic';

// The game owns the whole screen on phones: content runs under the notch/home bar (the HUD pads
// itself with env(safe-area-inset-*)), and pinch-zoom is off so two-thumb play never zooms the page.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0B1220',
};

export const metadata = {
  title: 'BGAP City 3D World',
  description: 'Explore the 3D city, meet characters, and investigate data challenges.',
};

export default async function GamePage() {
  // A real BGAP session (cookie from /auth/handoff or /login). It used to fall back to a fake dev
  // player on any error, in production too; now an unsigned visitor is sent to sign in.
  let session;
  try {
    session = await SessionValidator.validateSession(null);
  } catch {
    redirect('/login?next=/game');
  }

  return (
    <main className="w-screen h-screen overflow-hidden bg-bgap-dark relative">
      <GameClient session={session} />
    </main>
  );
}
