import { NextResponse } from 'next/server';
import { SessionValidator } from '@/server/game/SessionValidator';
import { getMission } from '@/server/content/missions';
import { startAttempt } from '@/server/game/attempts';
import { toAttemptView } from '@/server/game/attemptView';

export const dynamic = 'force-dynamic';

/** Opens (or resumes) the player's attempt on a mission. The attempt is what the grader trusts. */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await SessionValidator.validateSession(request.headers.get('authorization'));
    const pkg = getMission(params.id);
    if (!pkg) return NextResponse.json({ error: 'Unknown mission.' }, { status: 404 });
    const attempt = await startAttempt(session.userId, pkg.def.id);
    return NextResponse.json(toAttemptView(attempt, pkg.def));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not start the case.' }, { status: 400 });
  }
}
