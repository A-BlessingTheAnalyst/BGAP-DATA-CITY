import { NextResponse } from 'next/server';
import { SessionValidator } from '@/server/game/SessionValidator';
import { GameRepository } from '@/server/game/GameRepository';

export async function GET(request: Request) {
  const session = await SessionValidator.validateSession(request.headers.get('authorization'));
  const profile = await GameRepository.getProfile(session.userId);
  return NextResponse.json(profile);
}
