import { NextResponse } from 'next/server';
import { SessionValidator } from '@/server/game/SessionValidator';
import { getProfileView, saveProfile } from '@/server/game/profiles';

export const dynamic = 'force-dynamic';

const auth = (request: Request) => SessionValidator.validateSession(request.headers.get('authorization'));

/** The player's cadet (null before the character creator) and the outfit items they own. */
export async function GET(request: Request) {
  try {
    const session = await auth(request);
    return NextResponse.json(await getProfileView(session.userId));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status: 401 });
  }
}

/** Creates or updates the cadet: { name?, appearance?, equipped? }. Equipped items must be owned. */
export async function PUT(request: Request) {
  let session;
  try {
    session = await auth(request);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status: 401 });
  }
  try {
    await saveProfile(session.userId, await request.json());
    return NextResponse.json(await getProfileView(session.userId));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not save your cadet.' }, { status: 400 });
  }
}
