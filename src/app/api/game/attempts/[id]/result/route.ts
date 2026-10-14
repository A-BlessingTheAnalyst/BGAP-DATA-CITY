import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  return NextResponse.json({
    attemptId: params.id,
    status: 'completed',
    score: 95,
  });
}
