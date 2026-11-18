import { NextResponse } from 'next/server';
import { SessionValidator } from '@/server/game/SessionValidator';
import { payFare, InsufficientFunds, getWallet } from '@/server/economy/wallet';
import { fareFor } from '@/server/economy/fares';
import { routeBetween, pathLength, CITY_BOUNDS } from '@/features/game/world/kit/cityPlan';

export const dynamic = 'force-dynamic';

/** Hails a danfo/taxi for a fast-travel ride: { from: [x,z], to: [x,z] }. Pays the fare, then
 * returns the road distance so the client can teleport the player (the world/collision checks
 * happen client-side, same as any other spawn/teleport). */
export async function POST(request: Request) {
  let session;
  try {
    session = await SessionValidator.validateSession(request.headers.get('authorization'));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status: 401 });
  }
  try {
    const { from, to } = await request.json();
    const f = Array.isArray(from) ? from.map(Number) : [], t = Array.isArray(to) ? to.map(Number) : [];
    if (f.length !== 2 || t.length !== 2 || ![...f, ...t].every(Number.isFinite)) return NextResponse.json({ error: 'from/to must be [x, z].' }, { status: 400 });
    const B = CITY_BOUNDS;
    if (t[0] < B.minX || t[0] > B.maxX || t[1] < B.minZ || t[1] > B.maxZ) return NextResponse.json({ error: 'That destination is outside the city.' }, { status: 400 });
    const route = routeBetween([f[0], f[1]], [t[0], t[1]]);
    const metres = pathLength(route);
    const fare = fareFor(metres);
    await payFare({ userId: session.userId, amount: fare, reason: 'Danfo fare' });
    const wallet = await getWallet(session.userId);
    return NextResponse.json({ fare, metres: Math.round(metres), balance: wallet.balance });
  } catch (err) {
    if (err instanceof InsufficientFunds) return NextResponse.json({ error: err.message, balance: err.balance }, { status: 402 });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Hail failed.' }, { status: 400 });
  }
}
