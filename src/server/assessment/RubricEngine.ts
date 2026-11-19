import { MissionEvaluationResult } from '@/shared/types/mission';
import { getMission } from '@/server/content/missions';
import { gradeSql } from './SqlGrader';

// Turns a graded query into a score, feedback and pay.
//   Correctness  50 — share of hidden fixtures the query gets right
//   Edge cases   20 — the fixture built for this case's trap
//   Findings     20 — share of claims backed by the right evidence
//   Independence 10 — minus 3 per hint
// A pass needs the pass mark AND every fixture right. Pay follows docs/game-design.md:
// below 60 is a call-out fee; otherwise base × (0.5–1.0), +10% fast, −8% per hint.

export function payout(basePay: number, score: number, hintsUsed: number, fast: boolean): number {
  if (score < 60) return Math.round((basePay * 0.1) / 100) * 100;
  const mult = 0.5 + ((score - 60) / 40) * 0.5;
  const raw = basePay * mult * (fast ? 1.1 : 1) * Math.max(0, 1 - 0.08 * hintsUsed);
  return Math.round(raw / 100) * 100;
}

export type EvaluationResult = MissionEvaluationResult & {
  missionId: string;
  fixtures: { id: string; passed: boolean }[];
  findings: { id: string; correct: boolean }[];
  queryError: string | null;
};

export class RubricEngine {
  static async gradeSubmission(params: {
    missionId: string;
    query: string;
    /** Chosen option per finding claim: { [claimId]: optionId }. */
    findings?: Record<string, string>;
    /** Legacy single explanation (Chapter 1 before the findings step); maps to the first claim. */
    explanationId?: string;
    hintsUsed: number;
    fast?: boolean;
  }): Promise<EvaluationResult> {
    const pkg = getMission(params.missionId);
    if (!pkg) throw new Error(`Unknown mission ${params.missionId}`);
    const def = pkg.def;
    const hints = Math.max(0, Math.floor(params.hintsUsed || 0));
    // Python missions (reference.py, no reference.sql) aren't submittable through this endpoint
    // yet — PythonGrader.ts exists and is validated by scripts/test-python-grader.ts, but the
    // in-browser Python editor and its own submit route aren't built (masterprompt.md §15.4).
    if (!pkg.grading) throw new Error(`Mission ${def.id} is a Python mission; it isn't submittable through the SQL grading endpoint yet.`);
    const graded = await gradeSql(def.id, params.query, pkg.grading);

    const answers: Record<string, string> = { ...(params.findings ?? {}) };
    if (params.explanationId && def.findings[0] && !answers[def.findings[0].id]) answers[def.findings[0].id] = params.explanationId;
    const findingResults = def.findings.map((f) => ({ id: f.id, correct: f.options.some((o) => o.correct && o.id === answers[f.id]) }));
    const findingShare = def.findings.length ? findingResults.filter((f) => f.correct).length / def.findings.length : 1;

    const calculation = Math.round(50 * graded.passRate);
    const filter = graded.trapPassed ? 20 : 0;
    const explanation = Math.round(20 * findingShare);
    const independence = Math.max(0, 10 - hints * 3);
    const totalScore = calculation + filter + explanation + independence;
    const isPassed = totalScore >= def.passMark && graded.passRate === 1;

    let feedback: string;
    if (graded.queryError) {
      feedback = `Your query didn't run: ${graded.queryError}`;
    } else if (isPassed) {
      feedback = def.successFeedback;
    } else {
      const issues = [...new Set(graded.fixtures.filter((f) => !f.passed && f.hint).map((f) => f.hint as string))].slice(0, 2);
      const wrongClaims = def.findings.filter((f, i) => !findingResults[i].correct).map((f) => f.claim);
      if (wrongClaims.length) issues.push(`Check your answer to: “${wrongClaims[0]}”`);
      feedback = issues.join(' ') || 'Close, but not quite.';
    }

    return {
      missionId: def.id,
      isPassed,
      totalScore,
      scoreBreakdown: { calculation, filter, explanation, independence },
      feedback,
      xpEarned: isPassed ? def.xp : Math.round(def.xp / 6),
      creditsEarned: payout(def.pay, totalScore, hints, !!params.fast),
      badgeAwarded: isPassed ? def.badgeId : undefined,
      fixtures: graded.fixtures.map(({ id, passed }) => ({ id, passed })),
      findings: findingResults,
      queryError: graded.queryError,
    };
  }
}
