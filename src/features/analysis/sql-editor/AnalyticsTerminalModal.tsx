"use client";

import React, { useState } from 'react';
import { MonacoSqlEditor } from './MonacoSqlEditor';
import { SchemaViewer } from './SchemaViewer';
import { ResultTable } from '../results/ResultTable';
import { QueryMetrics } from '../results/QueryMetrics';
import { RubricFeedback } from '../results/RubricFeedback';
import { HintSystem } from '../results/HintSystem';
import { useDuckDb } from '../sql-worker/useDuckDb';
import { useGameState } from '../../game/engine/GameState';
import { MissionEvaluationResult } from '@/shared/types/mission';
import { Play, Send, X, Database, HelpCircle, Code } from 'lucide-react';

export const AnalyticsTerminalModal: React.FC = () => {
  const closeWorkstation = useGameState((s) => s.closeWorkstation);
  const setMissionState = useGameState((s) => s.setMissionState);

  const [query, setQuery] = useState(
    "SELECT CAST(sale_at AS DATE) AS sale_date,\n       SUM(quantity * unit_price) AS revenue\nFROM sales\nWHERE payment_status = 'completed'\nGROUP BY 1\nORDER BY 1;"
  );
  const [activeTab, setActiveTab] = useState<'editor' | 'schema' | 'hints'>('editor');
  const [explanationId, setExplanationId] = useState('expl_refunds_and_voids');
  const [evaluationResult, setEvaluationResult] = useState<MissionEvaluationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { runQuery, queryResult, isRunning, error } = useDuckDb();

  const handleExecute = async () => {
    await runQuery(query);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/game/attempts/ch1-attempt/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: 'ch1-attempt',
          missionId: 'ch1_cafe_revenue_mystery',
          query,
          explanationId,
          clientTimeMs: 1200,
        }),
      });
      const data: MissionEvaluationResult = await res.json();
      setEvaluationResult(data);
      if (data.isPassed) {
        setMissionState('completed');
      }
    } catch (err) {
      console.error(err);
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
              <span className="text-xs px-2 py-0.5 rounded bg-bgap-card text-bgap-cyan font-mono">
                Mission 01
              </span>
            </h1>
            <p className="text-xs text-bgap-muted">The Café Revenue Mystery — SQL Practice Engine</p>
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
            onClick={() => setActiveTab('hints')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              activeTab === 'hints'
                ? 'bg-bgap-cyan/20 text-bgap-cyan border border-bgap-cyan/40'
                : 'text-bgap-muted hover:text-bgap-text'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Hints & Help
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
        {/* Left Column: Editor or Schema */}
        <div className="flex-1 flex flex-col border-r border-bgap-border">
          {activeTab === 'editor' && (
            <>
              {/* Monaco Editor Container */}
              <div className="flex-1 relative">
                <MonacoSqlEditor value={query} onChange={setQuery} onRun={handleExecute} />
              </div>

              {/* Action Toolbar */}
              <div className="h-14 border-t border-bgap-border bg-bgap-surface px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExecute}
                    disabled={isRunning}
                    className="px-4 py-2 rounded-xl bg-bgap-cyan hover:bg-bgap-neon text-bgap-dark font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isRunning ? 'Executing...' : 'Run Query [Ctrl+Enter]'}</span>
                  </button>
                </div>

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
          {activeTab === 'hints' && <HintSystem onInsertSnippet={(snip) => setQuery(snip)} />}
        </div>

        {/* Right Column: Execution Output & Feedback */}
        <div className="w-[480px] flex flex-col bg-bgap-dark/50 overflow-y-auto">
          {/* Query Metrics Bar */}
          <QueryMetrics result={queryResult} error={error} isRunning={isRunning} />

          {/* Results Table */}
          <div className="flex-1 p-4 overflow-auto">
            <ResultTable result={queryResult} />
          </div>

          {/* Rubric Evaluation Results Modal Overlay */}
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
