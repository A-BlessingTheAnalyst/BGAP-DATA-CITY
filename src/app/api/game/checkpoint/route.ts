import { NextResponse } from 'next/server';
import { SessionValidator } from '@/server/game/SessionValidator';
import { sanitiseCheckpoint, saveCheckpoint } from '@/server/game/checkpoints';

export const dynamic = 'force-dynamic';

/** Saves where the player is standing. The user comes from the session; any userId in the body is ignored. */
export async function POST(request: Request) {
  let session;
  try {
    session = await SessionValidator.validateSession(request.headers.get('authorization'));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status: 401 });
  }
  try {
    const saved = await saveCheckpoint(session.userId, sanitiseCheckpoint(await request.json()));
    return NextResponse.json({ success: true, savedAt: saved.savedAt });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Invalid checkpoint' }, { status: 400 });
  }
}
