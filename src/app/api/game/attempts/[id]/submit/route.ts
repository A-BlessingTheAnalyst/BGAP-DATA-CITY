import { NextResponse } from 'next/server';
import { RubricEngine } from '@/server/assessment/RubricEngine';
import { SandboxRunner } from '@/server/assessment/SandboxRunner';
import { RewardLedgerService } from '@/server/rewards/RewardLedgerService';
import { SessionValidator } from '@/server/game/SessionValidator';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await SessionValidator.validateSession(request.headers.get('authorization'));
    const body = await request.json();
    const { query, explanationId, hintsUsed = 0, missionId = 'ch1_cafe_revenue_mystery' } = body;

    // Enforce read-only AST constraints
    SandboxRunner.enforceConstraints(query);

    // Evaluate submission against authoritative rubric
    const result = RubricEngine.gradeSubmission({
      query,
      explanationId,
      hintsUsed,
    });

    if (result.isPassed) {
      // Deterministic idempotency key: reward:<userId>:<missionId> strictly prevents double reward grants
      const deterministicKey = `reward:${session.userId}:${missionId}`;
      await RewardLedgerService.grantReward({
        userId: session.userId,
        xp: result.xpEarned,
        credits: result.creditsEarned,
        reason: `MISSION_COMPLETE:${missionId}`,
        idempotencyKey: deterministicKey,
      });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Submission error' }, { status: 400 });
  }
}
