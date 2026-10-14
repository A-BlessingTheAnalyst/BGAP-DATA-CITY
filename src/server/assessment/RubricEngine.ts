import { MissionEvaluationResult } from '@/shared/types/mission';
import { SqlEvaluator } from './SqlEvaluator';

export class RubricEngine {
  static gradeSubmission(params: {
    query: string;
    explanationId?: string;
    hintsUsed: number;
  }): MissionEvaluationResult {
    const { calculationPassed, filterPassed, hiddenFixturePassed } = SqlEvaluator.evaluateQuery(params.query);

    // 1. Numerical Aggregation & Grouping (50%)
    let calcScore = calculationPassed ? 50 : 0;

    // 2. Filter logic: Exclude voided & refunded orders (20%)
    let filterScore = filterPassed && hiddenFixturePassed ? 20 : 0;

    // 3. Business Findings Explanation (20%)
    let explScore = params.explanationId === 'expl_refunds_and_voids' ? 20 : 0;

    // 4. Independence: Deduct 3 points per hint consulted, minimum 0 (10%)
    let indepScore = Math.max(0, 10 - (params.hintsUsed || 0) * 3);

    const totalScore = calcScore + filterScore + explScore + indepScore;
    const isPassed = totalScore >= 75;

    let feedback = '';
    if (isPassed) {
      feedback = 'Outstanding work! By excluding voided duplicate orders and customer refund liabilities, your query accurately isolated recognized revenue (₦115,500 on Oct 1, ₦126,000 on Oct 2, and ₦91,350 on Oct 3). Customer footfall remains robust!';
    } else {
      const issues: string[] = [];
      if (!calcScore) issues.push('Ensure you SUM(quantity * unit_price) and GROUP BY the calendar date.');
      if (!filterScore) issues.push('Ensure you filter specifically for payment_status = \'completed\'.');
      if (!explScore) issues.push('Select the business hypothesis supported by your data findings.');
      feedback = issues.join(' ') || 'The calculation did not match the expected financial ledger.';
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
