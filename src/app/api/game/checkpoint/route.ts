import { NextResponse } from 'next/server';
import { CheckpointService } from '@/server/game/CheckpointService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json();
  const { userId = 'dev-cadet-analyst', zoneId, coords, rotationY } = body;

  await CheckpointService.savePlayerLocation(userId, zoneId, coords, rotationY);
  return NextResponse.json({ success: true, savedAt: new Date().toISOString() });
}
