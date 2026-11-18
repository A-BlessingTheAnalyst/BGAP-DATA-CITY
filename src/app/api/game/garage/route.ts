import { NextResponse } from 'next/server';
import { SessionValidator } from '@/server/game/SessionValidator';
import { getGarageView } from '@/server/game/garage';
import { vehicleCatalog } from '@/server/content/vehicles';
import { DRIVING_LICENCE_PRICE, FLIGHT_LICENCE_PRICE } from '@/shared/types/garage';

export const dynamic = 'force-dynamic';

/** What you own, where it's parked, whether you can drive or fly, and the dealership catalog. */
export async function GET(request: Request) {
  try {
    const session = await SessionValidator.validateSession(request.headers.get('authorization'));
    return NextResponse.json({ ...(await getGarageView(session.userId)), catalog: vehicleCatalog().items, licencePrice: DRIVING_LICENCE_PRICE, flightLicencePrice: FLIGHT_LICENCE_PRICE });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status: 401 });
  }
}
