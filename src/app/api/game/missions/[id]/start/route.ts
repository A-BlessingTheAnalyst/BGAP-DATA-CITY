import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({
    attemptId: `attempt-${Date.now()}`,
    missionId: params.id,
    status: 'active',
    startedAt: new Date().toISOString(),
  });
}
