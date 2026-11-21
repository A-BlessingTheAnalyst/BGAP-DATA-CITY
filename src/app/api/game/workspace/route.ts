import { NextResponse } from 'next/server';
import { getMission } from '@/server/content/missions';
import { SessionValidator } from '@/server/game/SessionValidator';
import { launchWorkspace, verifyWorkspace } from '@/server/game/workspace';
import { getWallet } from '@/server/economy/wallet';

export const dynamic = 'force-dynamic';

/**
 * POST { missionId, action: 'launch' } → { url } to open workspace.bgap.app for a spreadsheet case
 *      (the client appends its own Supabase tokens in the #hash, as bgap.app does).
 * POST { missionId, action: 'verify' } → reads the workspace's graded completion and pays once.
 */
export async function POST(request: Request) {
  try {
    const session = await SessionValidator.validateSession(request.headers.get('authorization'));
    const { missionId, action } = await request.json();
    const pkg = getMission(String(missionId ?? ''));
    if (!pkg) return NextResponse.json({ error: 'Unknown mission.' }, { status: 404 });
    if (action === 'launch') {
      const origin = new URL(request.url).origin;
      const out = await launchWorkspace(session.userId, pkg.def, pkg.data, `${origin}/game?workspace=${encodeURIComponent(pkg.def.id)}`);
      return NextResponse.json(out);
    }
    if (action === 'verify') {
      const out = await verifyWorkspace(session.userId, pkg.def);
      const wallet = out.completed ? await getWallet(session.userId) : null;
      return NextResponse.json({ ...out, balance: wallet?.balance ?? null });
    }
    return NextResponse.json({ error: 'action must be launch or verify' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Workspace error' }, { status: 400 });
  }
}
