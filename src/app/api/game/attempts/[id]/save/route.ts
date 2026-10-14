import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  console.log('[API] Saved attempt draft query for:', params.id, body.query?.slice(0, 40));
  return NextResponse.json({ success: true, savedAt: new Date().toISOString() });
}
