import { NextResponse } from 'next/server';
import { SessionValidator } from '@/server/game/SessionValidator';
import { buyVehicleOrLicence, getGarageView } from '@/server/game/garage';
import { getWallet, InsufficientFunds } from '@/server/economy/wallet';

export const dynamic = 'force-dynamic';

/** Buys a car (price from the catalog) or the driving licence: { itemId }. */
export async function POST(request: Request) {
  let session;
  try {
    session = await SessionValidator.validateSession(request.headers.get('authorization'));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status: 401 });
  }
  try {
    const { itemId } = await request.json();
    const { created, name } = await buyVehicleOrLicence(session.userId, String(itemId ?? ''));
    const wallet = await getWallet(session.userId);
    return NextResponse.json({ created, name, balance: wallet.balance, ...(await getGarageView(session.userId)) });
  } catch (err) {
    if (err instanceof InsufficientFunds) return NextResponse.json({ error: err.message, balance: err.balance }, { status: 402 });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Purchase failed.' }, { status: 400 });
  }
}
