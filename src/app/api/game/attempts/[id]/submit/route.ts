import { NextResponse } from 'next/server';
import { RubricEngine } from '@/server/assessment/RubricEngine';
import { getMission } from '@/server/content/missions';
import { SandboxRunner } from '@/server/assessment/SandboxRunner';
import { creditMissionReward, getWallet } from '@/server/economy/wallet';
import { SessionValidator } from '@/server/game/SessionValidator';
import { getAttempt, isFast, recordSubmission } from '@/server/game/attempts';

export const dynamic = 'force-dynamic';

/**
 * Grades a submission on the player's attempt (`[id]` is the attempt id from /missions/[id]/start).
 * Hints and timing come from the attempt record, never the request body; pay is written once per
 * mission through the idempotent ledger.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await SessionValidator.validateSession(request.headers.get('authorization'));
    const attempt = await getAttempt(session.userId, params.id);
    if (!attempt) return NextResponse.json({ error: 'Start the case first: this attempt was not found.' }, { status: 404 });
    const pkg = getMission(attempt.missionId);
    if (!pkg) return NextResponse.json({ error: 'Unknown mission.' }, { status: 404 });
    const { query, findings, explanationId } = await request.json();

    // Read-only, single-statement check before the query reaches DuckDB.
    SandboxRunner.enforceConstraints(String(query ?? ''));

    const fast = isFast(attempt, pkg.def);
    const result = await RubricEngine.gradeSubmission({
      missionId: pkg.def.id,
      query: String(query),
      explanationId,
      findings: findings && typeof findings === 'object' ? findings : undefined,
      hintsUsed: attempt.hintLog.length,
      fast,
    });
    await recordSubmission(session.userId, attempt.id, result);

    let alreadyPaid = false;
    if (result.isPassed) {
      const { created } = await creditMissionReward({
        userId: session.userId,
        missionId: pkg.def.id,
        amount: result.creditsEarned,
        xp: result.xpEarned,
        reason: `Paid by ${pkg.def.client.business}`,
      });
      alreadyPaid = !created;
    }
    const wallet = await getWallet(session.userId);
    return NextResponse.json({ ...result, hintsUsed: attempt.hintLog.length, fast, alreadyPaid, balance: wallet.balance });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Submission error' }, { status: 400 });
  }
}
