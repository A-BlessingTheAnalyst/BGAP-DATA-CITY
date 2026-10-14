import { NextResponse } from 'next/server';
import { SessionValidator } from '@/server/game/SessionValidator';
import { GameRepository } from '@/server/game/GameRepository';
import { CAFE_MISSION } from '@/features/game/missions/chapter1-cafe/CafeMissionDefinition';

export async function GET(request: Request) {
  const session = await SessionValidator.validateSession(request.headers.get('authorization'));
  const profile = await GameRepository.getProfile(session.userId);

  return NextResponse.json({
    user: session,
    profile,
    spawnZone: 'academy_plaza',
    spawnCoords: [0, 0.9, 0],
    activeMission: CAFE_MISSION,
    settings: {
      graphicsQuality: 'balanced',
    },
  });
}
