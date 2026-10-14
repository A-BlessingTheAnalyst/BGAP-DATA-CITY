"use client";

import React from 'react';
import { MissionEvaluationResult } from '@/shared/types/mission';
import { Award, CheckCircle, XCircle } from 'lucide-react';

interface Props {
  result: MissionEvaluationResult;
  onClose: () => void;
}

export const RubricFeedback: React.FC<Props> = ({ result, onClose }) => {
  const { isPassed, totalScore, scoreBreakdown, feedback, xpEarned, creditsEarned, badgeAwarded } = result;

  return (
    <div className="space-y-4 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPassed ? (
            <CheckCircle className="w-5 h-5 text-bgap-emerald" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400" />
          )}
          <span className="font-bold text-sm text-bgap-text">
            {isPassed ? 'Mission Accomplished!' : 'Evaluation Incomplete'}
          </span>
        </div>
        <span className="text-lg font-mono font-bold text-bgap-cyan">{totalScore}%</span>
      </div>

      <p className="text-xs text-bgap-text/90 leading-relaxed bg-bgap-card p-3 rounded-xl border border-bgap-border">
        {feedback}
      </p>

      {/* Rubric Breakdown Progress Bars */}
      <div className="space-y-2 text-xs font-mono">
        <div className="flex justify-between text-bgap-muted">
          <span>Revenue Aggregation (50%)</span>
          <span className="text-bgap-text font-bold">{scoreBreakdown.calculation}/50</span>
        </div>
        <div className="flex justify-between text-bgap-muted">
          <span>Status Filter Logic (20%)</span>
          <span className="text-bgap-text font-bold">{scoreBreakdown.filter}/20</span>
        </div>
        <div className="flex justify-between text-bgap-muted">
          <span>Business Interpretation (20%)</span>
          <span className="text-bgap-text font-bold">{scoreBreakdown.explanation}/20</span>
        </div>
        <div className="flex justify-between text-bgap-muted">
          <span>Independence (10%)</span>
          <span className="text-bgap-text font-bold">{scoreBreakdown.independence}/10</span>
        </div>
      </div>

      {isPassed && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-bgap-emerald/20 to-bgap-cyan/20 border border-bgap-emerald/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-bgap-gold" />
            <div>
              <div className="text-xs font-bold text-bgap-text">Badge: Café Data Sleuth</div>
              <div className="text-[10px] text-bgap-muted">+{xpEarned} XP • +{creditsEarned} Credits</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
