import { NextResponse } from 'next/server';
import { RubricEngine } from '@/server/assessment/RubricEngine';
import { SandboxRunner } from '@/server/assessment/SandboxRunner';
import { RewardLedgerService } from '@/server/rewards/RewardLedgerService';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { query, explanationId, hintsUsed = 0 } = body;

    // Enforce safety constraints
    SandboxRunner.enforceConstraints(query);

    // Evaluate submission against authoritative rubric
    const result = RubricEngine.gradeSubmission({
      query,
      explanationId,
      hintsUsed,
    });

    if (result.isPassed) {
      await RewardLedgerService.grantReward({
        userId: 'demo-user-1',
        xp: result.xpEarned,
        credits: result.creditsEarned,
        reason: `MISSION_COMPLETE:${params.id}`,
        idempotencyKey: `reward-${params.id}-${Date.now()}`,
      });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Submission error' }, { status: 400 });
  }
}
