import { NextResponse } from 'next/server';
import { CheckpointService } from '@/server/game/CheckpointService';

export async function POST(request: Request) {
  const body = await request.json();
  const { userId = 'demo-user-1', zoneId, coords, rotationY } = body;

  await CheckpointService.savePlayerLocation(userId, zoneId, coords, rotationY);
  return NextResponse.json({ success: true, savedAt: new Date().toISOString() });
}
