import { NextResponse } from 'next/server';
import { SessionValidator } from '@/server/game/SessionValidator';
import { listMissions, toPublic } from '@/server/content/missions';
import { getWallet } from '@/server/economy/wallet';
import { getCheckpoint } from '@/server/game/checkpoints';
import { MARKET_LAYOUT } from '@/shared/constants/marketLayout';

export const dynamic = 'force-dynamic';

/** Everything the game needs on load: who you are, your wallet, the job board and where to spawn. */
export async function GET(request: Request) {
  try {
    const session = await SessionValidator.validateSession(request.headers.get('authorization'));
    const wallet = await getWallet(session.userId);
    const checkpoint = getCheckpoint(session.userId);
    return NextResponse.json({
      user: { userId: session.userId, role: session.role },
      wallet: { balance: wallet.balance, xp: wallet.xp, completedMissions: wallet.completedMissions },
      missions: listMissions().map((p) => toPublic(p.def)),
      spawn: checkpoint ? { zoneId: checkpoint.zoneId, coords: checkpoint.coords, rotationY: checkpoint.rotationY } : { zoneId: 'market', coords: MARKET_LAYOUT.spawn, rotationY: 0 },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status: 401 });
  }
}
