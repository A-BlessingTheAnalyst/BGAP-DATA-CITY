import { NextResponse } from 'next/server';
import { SessionValidator } from '@/server/game/SessionValidator';
import { callVehicle } from '@/server/game/garage';

export const dynamic = 'force-dynamic';

/** Moves an owned car to a position in the city: { vehicleId, position: [x,y,z], rotationY }. */
export async function POST(request: Request) {
  try {
    const session = await SessionValidator.validateSession(request.headers.get('authorization'));
    const { vehicleId, position, rotationY } = await request.json();
    const p = Array.isArray(position) ? position.map(Number) : [];
    if (p.length !== 3 || !p.every(Number.isFinite)) return NextResponse.json({ error: 'position must be [x,y,z].' }, { status: 400 });
    const vehicle = await callVehicle(session.userId, String(vehicleId ?? ''), [p[0], p[1], p[2]], Number(rotationY) || 0);
    return NextResponse.json({ vehicle });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not call the car.' }, { status: 400 });
  }
}
