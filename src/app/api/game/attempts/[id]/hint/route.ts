import { NextResponse } from 'next/server';
import { SessionValidator } from '@/server/game/SessionValidator';
import { getMission } from '@/server/content/missions';
import { getAttempt, revealHint } from '@/server/game/attempts';
import { toAttemptView } from '@/server/game/attemptView';

export const dynamic = 'force-dynamic';

/** Reveals the next hint. Logged on the attempt, so the grader counts it whatever the client says. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await SessionValidator.validateSession(request.headers.get('authorization'));
    const attempt = await getAttempt(session.userId, params.id);
    if (!attempt) return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 });
    const pkg = getMission(attempt.missionId);
    if (!pkg) return NextResponse.json({ error: 'Unknown mission.' }, { status: 404 });
    const { index } = await request.json();
    const updated = await revealHint(session.userId, attempt.id, Number(index), pkg.def.hints.length);
    return NextResponse.json(toAttemptView(updated, pkg.def));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Hint unavailable.' }, { status: 400 });
  }
}
