import { MissionEvaluationResult } from '@/shared/types/mission';
import { SqlEvaluator } from './SqlEvaluator';

export class RubricEngine {
  static gradeSubmission(params: {
    query: string;
    explanationId?: string;
    hintsUsed: number;
  }): MissionEvaluationResult {
    const { calculationPassed, filterPassed } = SqlEvaluator.evaluateQuery(params.query);

    let calcScore = calculationPassed ? 50 : 0;
    let filterScore = filterPassed ? 20 : 0;
    let explScore = params.explanationId === 'expl_refunds_and_voids' ? 20 : 5;
    let indepScore = Math.max(0, 10 - params.hintsUsed * 3);

    const totalScore = calcScore + filterScore + explScore + indepScore;
    const isPassed = totalScore >= 75;

    let feedback = '';
    if (isPassed) {
      feedback = 'Outstanding work, Detective! By isolating completed transactions from voided and refunded items, you revealed that daily customer traffic remains healthy, but uncollected refunds skewed the aggregate ledger.';
    } else {
      feedback = 'Your daily totals include cancelled and refunded tickets, causing the ledger to diverge from verified bank income. Re-examine the payment_status filter!';
    }

    return {
      isPassed,
      totalScore,
      scoreBreakdown: {
        calculation: calcScore,
        filter: filterScore,
        explanation: explScore,
        independence: indepScore,
      },
      feedback,
      xpEarned: isPassed ? 150 : 25,
      creditsEarned: isPassed ? 500 : 50,
      badgeAwarded: isPassed ? 'badge_cafe_sleuth' : undefined,
    };
  }
}
