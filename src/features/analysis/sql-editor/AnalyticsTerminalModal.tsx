"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MonacoSqlEditor } from './MonacoSqlEditor';
import { SchemaViewer } from './SchemaViewer';
import { ResultTable } from '../results/ResultTable';
import { QueryMetrics } from '../results/QueryMetrics';
import { RubricFeedback } from '../results/RubricFeedback';
import { HintSystem } from '../results/HintSystem';
import { useDuckDb } from '../sql-worker/useDuckDb';
import { useGameState } from '../../game/engine/GameState';
import { MissionEvaluationResult } from '@/shared/types/mission';
import { Play, Send, X, Database, HelpCircle, Code, Lightbulb } from 'lucide-react';

const STARTER_QUERY_TEMPLATE = `-- BGAP Analytics Workstation — Chapter 01: The Café Revenue Mystery
-- Objective: Calculate daily recognized revenue from completed sales.
-- Hint: Exclude 'refunded' and 'voided' transactions.

SELECT 
    CAST(sale_at AS DATE) AS sale_date,
    SUM(quantity * unit_price) AS revenue
FROM sales
WHERE payment_status = 'completed'
GROUP BY 1
ORDER BY 1;`;

export const AnalyticsTerminalModal: React.FC = () => {
  const closeWorkstation = useGameState((s) => s.closeWorkstation);
  const setMissionState = useGameState((s) => s.setMissionState);
  const missionState = useGameState((s) => s.missionState);

  const [query, setQuery] = useState(STARTER_QUERY_TEMPLATE);
  const [activeTab, setActiveTab] = useState<'editor' | 'schema' | 'hints'>('editor');
  const [explanationId, setExplanationId] = useState<string>(''); // Unselected by default
  const [attemptId, setAttemptId] = useState<string>('attempt-ch1-active');
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [evaluationResult, setEvaluationResult] = useState<MissionEvaluationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { runQuery, queryResult, isRunning, error } = useDuckDb();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize or resume attempt session from authoritative server endpoint
  useEffect(() => {
    async function initAttempt() {
      try {
        const res = await fetch('/api/game/missions/ch1_cafe_revenue_mystery/start', {
          method: 'POST',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.attemptId) setAttemptId(data.attemptId);
        }
      } catch (e) {
        console.warn('[Terminal] Failed to start server attempt, using local fallback:', e);
      }
    }
    initAttempt();
  }, []);

  // Debounced auto-save draft query to server
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/game/attempts/${attemptId}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
      } catch (e) {}
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [query, attemptId]);

  const handleExecute = async () => {
    await runQuery(query);
  };

  const handleSubmit = async () => {
    if (!explanationId) {
      setSubmitError('Please select your business finding/explanation before submitting for official grading.');
      return;
    }
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/game/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          missionId: 'ch1_cafe_revenue_mystery',
          query,
          explanationId,
          hintsUsed,
          clientTimeMs: 1400,
        }),
      });

      const data: MissionEvaluationResult = await res.json();
      setEvaluationResult(data);
      if (data.isPassed) {
        setMissionState('completed');
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit official solution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-bgap-dark/85 backdrop-blur-xl flex flex-col z-50 pointer-events-auto select-none">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-bgap-border bg-bgap-surface px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-bgap-cyan/10 border border-bgap-cyan/30 flex items-center justify-center">
            <Database className="w-4 h-4 text-bgap-cyan" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-bgap-text flex items-center gap-2">
              <span>BGAP ANALYTICS WORKSTATION</span>
              <span className="text-xs px-2 py-0.5 rounded bg-bgap-card text-bgap-cyan font-mono font-bold">
                Chapter 01
              </span>
            </h1>
            <p className="text-xs text-bgap-muted">The Café Revenue Mystery — Live SQL Practice</p>
          </div>
        </div>

        {/* Tab Buttons & Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'editor'
                ? 'bg-bgap-cyan/20 text-bgap-cyan border border-bgap-cyan/40'
                : 'text-bgap-muted hover:text-bgap-text'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            SQL Workspace
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'schema'
                ? 'bg-bgap-cyan/20 text-bgap-cyan border border-bgap-cyan/40'
                : 'text-bgap-muted hover:text-bgap-text'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Data Schema
          </button>
          <button
            onClick={() => {
              setActiveTab('hints');
              setHintsUsed((h) => h + 1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'hints'
                ? 'bg-bgap-cyan/20 text-bgap-cyan border border-bgap-cyan/40'
                : 'text-bgap-muted hover:text-bgap-text'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Hints & Guidance
          </button>

          <button
            onClick={closeWorkstation}
            className="w-8 h-8 rounded-lg bg-bgap-card text-bgap-muted hover:text-bgap-text flex items-center justify-center ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Monaco Editor or Schema */}
        <div className="flex-1 flex flex-col border-r border-bgap-border">
          {activeTab === 'editor' && (
            <>
              {/* Monaco Editor Container */}
              <div className="flex-1 relative">
                <MonacoSqlEditor value={query} onChange={setQuery} onRun={handleExecute} />
              </div>

              {/* Action Toolbar */}
              <div className="h-14 border-t border-bgap-border bg-bgap-surface px-4 flex items-center justify-between">
                <button
                  onClick={handleExecute}
                  disabled={isRunning}
                  className="px-4 py-2 rounded-xl bg-bgap-cyan hover:bg-bgap-neon text-bgap-dark font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunning ? 'Executing...' : 'Run Query [Ctrl+Enter]'}</span>
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-bgap-emerald to-emerald-400 hover:opacity-90 text-bgap-dark font-bold text-xs flex items-center gap-1.5 shadow-neon-emerald transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Evaluating...' : 'Submit Official Solution'}</span>
                </button>
              </div>
            </>
          )}

          {activeTab === 'schema' && <SchemaViewer />}
          {activeTab === 'hints' && (
            <HintSystem onInsertSnippet={(snip) => {
              setQuery(snip);
              setActiveTab('editor');
            }} />
          )}
        </div>

        {/* Right Column: Execution Output, Explanation & Rubric Feedback */}
        <div className="w-[500px] flex flex-col bg-bgap-dark/50 overflow-y-auto">
          {/* Query Metrics Bar */}
          <QueryMetrics result={queryResult} error={error} isRunning={isRunning} />

          {/* Results Table */}
          <div className="flex-1 p-4 overflow-auto min-h-[220px]">
            <ResultTable result={queryResult} />
          </div>

          {/* Interactive Business Explanation Form */}
          <div className="p-4 border-t border-bgap-border bg-bgap-surface/90">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-bgap-gold" />
              <h3 className="text-xs font-bold text-bgap-text uppercase font-mono tracking-wider">
                Step 2: Analytical Conclusion (Required)
              </h3>
            </div>
            <p className="text-[11px] text-bgap-muted mb-3">
              What does your analysis explain about the café's reported revenue decline?
            </p>

            <div className="space-y-2 mb-3">
              {[
                {
                  id: 'expl_footfall_drop',
                  label: 'Customer volume decreased sharply during afternoon hours.',
                },
                {
                  id: 'expl_refunds_and_voids',
                  label: 'Actual customer traffic is steady; accidental voided tickets and pending refund liabilities distorted the gross reporting balance.',
                },
                {
                  id: 'expl_catering_discount',
                  label: 'Heavy discounts on catering packages eroded all operating margins.',
                },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    explanationId === opt.id
                      ? 'bg-bgap-cyan/10 border-bgap-cyan text-bgap-text font-medium'
                      : 'bg-bgap-card border-bgap-border text-bgap-muted hover:border-bgap-border/80'
                  }`}
                >
                  <input
                    type="radio"
                    name="explanation"
                    value={opt.id}
                    checked={explanationId === opt.id}
                    onChange={() => setExplanationId(opt.id)}
                    className="mt-0.5 accent-cyan-400"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            {submitError && (
              <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/30">
                {submitError}
              </p>
            )}
          </div>

          {/* Rubric Evaluation Results */}
          {evaluationResult && (
            <div className="p-4 border-t border-bgap-border bg-bgap-surface">
              <RubricFeedback
                result={evaluationResult}
                onClose={() => setEvaluationResult(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
