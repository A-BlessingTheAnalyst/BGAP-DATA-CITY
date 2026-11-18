import { NextResponse } from 'next/server';
import { SessionValidator } from '@/server/game/SessionValidator';
import { getWallet } from '@/server/economy/wallet';

export const dynamic = 'force-dynamic';

/** The player's balance, XP, recent ledger entries and completed missions. */
export async function GET(request: Request) {
  try {
    const session = await SessionValidator.validateSession(request.headers.get('authorization'));
    return NextResponse.json(await getWallet(session.userId));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Wallet unavailable' }, { status: 401 });
  }
}
