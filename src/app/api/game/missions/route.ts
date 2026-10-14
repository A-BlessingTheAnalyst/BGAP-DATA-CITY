import { NextResponse } from 'next/server';
import { CAFE_MISSION } from '@/features/game/missions/chapter1-cafe/CafeMissionDefinition';

export async function GET() {
  return NextResponse.json([
    {
      ...CAFE_MISSION,
      status: 'active',
    },
  ]);
}
