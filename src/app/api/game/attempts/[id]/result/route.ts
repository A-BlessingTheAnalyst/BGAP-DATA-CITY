import { NextResponse } from 'next/server';
import { SessionValidator } from '@/server/game/SessionValidator';
import { getAttempt } from '@/server/game/attempts';

export const dynamic = 'force-dynamic';

/** The latest graded result on an attempt. */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await SessionValidator.validateSession(request.headers.get('authorization'));
    const a = await getAttempt(session.userId, params.id);
    if (!a) return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 });
    return NextResponse.json({ attemptId: a.id, missionId: a.missionId, status: a.status, submissions: a.submissions, hintsUsed: a.hintLog.length, lastResult: a.lastResult });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unavailable.' }, { status: 401 });
  }
}
