"use client";

import React from 'react';
import { MissionEvaluationResult } from '@/shared/types/mission';
import { Award, CheckCircle, XCircle } from 'lucide-react';

interface Props {
  result: MissionEvaluationResult;
  onClose: () => void;
}

export const RubricFeedback: React.FC<Props> = ({ result, onClose }) => {
  const { isPassed, totalScore, scoreBreakdown, feedback, xpEarned, creditsEarned, badgeAwarded, alreadyPaid, fast, hintsUsed } = result;

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
            {isPassed ? 'Case closed. Client paid.' : 'Not there yet'}
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
          <span>Correct results on hidden data (50%)</span>
          <span className="text-bgap-text font-bold">{scoreBreakdown.calculation}/50</span>
        </div>
        <div className="flex justify-between text-bgap-muted">
          <span>Handled the case’s trap (20%)</span>
          <span className="text-bgap-text font-bold">{scoreBreakdown.filter}/20</span>
        </div>
        <div className="flex justify-between text-bgap-muted">
          <span>Findings backed by evidence (20%)</span>
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
              {alreadyPaid ? (
                <>
                  <div className="text-xs font-bold text-bgap-text">Already paid for this case</div>
                  <div className="text-[10px] text-bgap-muted">Each client pays once. Nothing new was added to your wallet.</div>
                </>
              ) : (
                <>
                  <div className="text-xs font-bold text-bgap-text">{badgeAwarded ? 'Badge earned · payment received' : 'Payment received'}</div>
                  <div className="text-[10px] text-bgap-muted">
                    +₦{creditsEarned.toLocaleString('en-NG')} · +{xpEarned} XP
                    {fast ? ' · fast-finish bonus' : ''}
                    {hintsUsed ? ` · ${hintsUsed} hint${hintsUsed === 1 ? '' : 's'} used` : ''}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
