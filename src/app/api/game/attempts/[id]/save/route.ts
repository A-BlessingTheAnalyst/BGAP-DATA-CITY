import { NextResponse } from 'next/server';
import { SessionValidator } from '@/server/game/SessionValidator';
import { saveDraft } from '@/server/game/attempts';

export const dynamic = 'force-dynamic';

/** Saves the player's draft query on their attempt (restored when the terminal reopens). */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await SessionValidator.validateSession(request.headers.get('authorization'));
    const { query } = await request.json();
    if (typeof query !== 'string') return NextResponse.json({ error: 'query must be text.' }, { status: 400 });
    const a = await saveDraft(session.userId, params.id, query);
    return NextResponse.json({ success: true, savedAt: new Date().toISOString(), attemptId: a.id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Save failed.' }, { status: 400 });
  }
}
