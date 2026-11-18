"use client";

import React, { useEffect, useRef, useState } from 'react';
import { MonacoSqlEditor } from './MonacoSqlEditor';
import { SchemaViewer } from './SchemaViewer';
import { ResultTable } from '../results/ResultTable';
import { QueryMetrics } from '../results/QueryMetrics';
import { RubricFeedback } from '../results/RubricFeedback';
import { HintSystem } from '../results/HintSystem';
import { useDuckDb } from '../sql-worker/useDuckDb';
import { useGameState } from '../../game/engine/GameState';
import { AudioManager } from '../../game/audio/AudioManager';
import { refreshWallet, useCareerStore } from '../../game/ui/phone/useCareer';
import type { MissionEvaluationResult } from '@/shared/types/mission';
import type { AttemptView, HintDef, PublicMissionDetail } from '@/shared/types/content';
import { Play, Send, X, Database, HelpCircle, Code, Scale, FileSearch, Lock } from 'lucide-react';

type Tab = 'editor' | 'schema' | 'hints';

const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

export const AnalyticsTerminalModal: React.FC = () => {
  const missionId = useGameState((s) => s.terminalMissionId) ?? 'ch1_cafe_revenue_mystery';
  const closeWorkstation = useGameState((s) => s.closeWorkstation);
  const setMissionState = useGameState((s) => s.setMissionState);
  const markMissionCompleted = useGameState((s) => s.markMissionCompleted);
  const foundEvidence = useGameState((s) => s.foundEvidence);

  const [mission, setMission] = useState<PublicMissionDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('editor');
  const [attempt, setAttempt] = useState<AttemptView | null>(null);
  const [revealed, setRevealed] = useState<HintDef[]>([]);
  const [hintBusy, setHintBusy] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);
  const hintsUsed = revealed.length;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [evaluation, setEvaluation] = useState<MissionEvaluationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { runQuery, queryResult, isRunning, error, ready } = useDuckDb(mission);

  // Load the case: tables, visible data, hints and findings (never answers or hidden data).
  useEffect(() => {
    let cancelled = false;
    setMission(null);
    setLoadError(null);
    setAttempt(null);
    const json = async (r: Response) => (r.ok ? r.json() : Promise.reject(new Error((await r.json().catch(() => null))?.error ?? r.statusText)));
    // The case (public data only) and the server-side attempt (hints, draft, start time) together.
    Promise.all([
      fetch(`/api/game/missions/${missionId}`).then(json),
      fetch(`/api/game/missions/${missionId}/start`, { method: 'POST' }).then(json),
    ])
      .then(([m, a]: [PublicMissionDetail, AttemptView]) => {
        if (cancelled) return;
        setMission(m);
        setAttempt(a);
        setRevealed(a.revealedHints);
        setQuery(a.draft ?? m.starterSql);
        setAnswers({});
        setEvaluation(null);
      })
      .catch((e) => !cancelled && setLoadError(`This case couldn't be loaded: ${e.message}`));
    return () => { cancelled = true; };
  }, [missionId]);

  // Autosave the draft to the attempt a moment after typing stops.
  const lastSaved = useRef<string | null>(null);
  useEffect(() => {
    if (!attempt || attempt.status !== 'open' || !mission || query === lastSaved.current) return;
    if (lastSaved.current === null) { lastSaved.current = query; return; } // first load
    const t = window.setTimeout(() => {
      lastSaved.current = query;
      fetch(`/api/game/attempts/${attempt.attemptId}/save`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) }).catch(() => undefined);
    }, 1500);
    return () => window.clearTimeout(t);
  }, [query, attempt, mission]);

  const revealHint = async (index: number) => {
    if (!attempt) return;
    setHintBusy(true);
    setHintError(null);
    try {
      const r = await fetch(`/api/game/attempts/${attempt.attemptId}/hint`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ index }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error ?? 'Hint unavailable.');
      setRevealed((data as AttemptView).revealedHints);
      AudioManager.playUi('select');
    } catch (e) {
      setHintError(e instanceof Error ? e.message : 'Hint unavailable.');
    } finally {
      setHintBusy(false);
    }
  };

  const hasEvidence = (id?: string) => !id || foundEvidence.includes(`${missionId}:${id}`);
  const evidenceById = (id?: string) => mission?.evidence?.find((e) => e.id === id);
  const notes = (mission?.evidence ?? []).filter((e) => hasEvidence(e.id));
  const findingsComplete = !!mission && mission.findings.every((f) => answers[f.id]);

  const handleSubmit = async () => {
    if (!mission || !attempt) return;
    if (!findingsComplete) {
      setSubmitError('Answer every finding before you submit: back each claim with what your query showed.');
      return;
    }
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/game/attempts/${attempt.attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, findings: answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data?.error ?? 'The grader could not check this submission.');
        AudioManager.playUi('error');
        return;
      }
      const result = data as MissionEvaluationResult;
      setEvaluation(result);
      AudioManager.playUi(result.isPassed ? 'confirm' : 'error');
      if (result.isPassed) {
        markMissionCompleted(mission.id);
        if (mission.id === 'ch1_cafe_revenue_mystery') setMissionState('completed');
        refreshWallet();
        // Move the tracker on to the next open job in the city.
        const gs = useGameState.getState();
        if (gs.trackedMissionId === mission.id) {
          const done = new Set([...gs.completedMissions, mission.id]);
          const next = useCareerStore.getState().missions?.find((m) => !m.location.remote && !done.has(m.id));
          gs.trackMission(next?.id ?? null);
        }
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Could not reach the grader.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabButton = (id: Tab, label: string, Icon: typeof Code) => (
    <button
      onClick={() => setTab(id)}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${tab === id ? 'bg-bgap-cyan/20 text-bgap-cyan border border-bgap-cyan/40' : 'text-bgap-muted hover:text-bgap-text'}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );

  return (
    <div role="dialog" aria-label="Analytics terminal" className="fixed inset-0 bg-bgap-dark/85 backdrop-blur-xl flex flex-col z-50 pointer-events-auto select-none">
      <header className="min-h-14 border-b border-bgap-border bg-bgap-surface px-6 py-2 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-bgap-cyan/10 border border-bgap-cyan/30 flex items-center justify-center shrink-0">
            <Database className="w-4 h-4 text-bgap-cyan" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-bgap-text flex items-center gap-2">
              <span className="truncate">{mission?.title ?? 'Loading case…'}</span>
              {mission && <span className="text-xs px-2 py-0.5 rounded bg-bgap-card text-bgap-cyan font-mono font-bold">Tier {mission.tier}</span>}
              {mission && <span className="text-xs px-2 py-0.5 rounded bg-bgap-card text-bgap-gold font-mono">{naira(mission.pay)}</span>}
            </h1>
            <p className="text-xs text-bgap-muted truncate">{mission ? `${mission.client.business} · ${mission.summary}` : ' '}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tabButton('editor', 'SQL', Code)}
          {tabButton('schema', 'Data', Database)}
          {tabButton('hints', `Hints${hintsUsed ? ` (${hintsUsed})` : ''}`, HelpCircle)}
          <button onClick={closeWorkstation} aria-label="Close terminal" className="w-8 h-8 rounded-lg bg-bgap-card text-bgap-muted hover:text-bgap-text flex items-center justify-center ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {loadError && <p className="m-6 text-sm text-red-400">{loadError}</p>}

      {mission && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
          <div className="lg:flex-1 flex flex-col border-r border-bgap-border min-h-[55vh] lg:min-h-0">
            {tab === 'editor' && (
              <>
                <div className="flex-1 relative min-h-[240px]">
                  <MonacoSqlEditor value={query} onChange={setQuery} onRun={() => runQuery(query)} />
                </div>
                <div className="h-14 border-t border-bgap-border bg-bgap-surface px-4 flex items-center justify-between gap-2">
                  <button
                    onClick={() => runQuery(query)}
                    disabled={isRunning || !ready}
                    className="px-4 py-2 rounded-xl bg-bgap-cyan hover:bg-bgap-neon text-bgap-dark font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{!ready ? 'Loading data…' : isRunning ? 'Running…' : 'Run query (Ctrl+Enter)'}</span>
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !attempt}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-bgap-emerald to-emerald-400 hover:opacity-90 text-bgap-dark font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Grading…' : 'Submit to client'}</span>
                  </button>
                </div>
              </>
            )}
            {tab === 'schema' && <SchemaViewer tables={mission.tables} data={mission.data} />}
            {tab === 'hints' && (
              <HintSystem
                titles={mission.hints}
                revealed={revealed}
                onReveal={revealHint}
                busy={hintBusy}
                error={hintError}
                onInsertSnippet={(snip) => { setQuery((q) => `${q}\n${snip}`); setTab('editor'); }}
              />
            )}
          </div>

          <div className="lg:w-[500px] flex flex-col bg-bgap-dark/50 lg:overflow-y-auto shrink-0">
            <QueryMetrics result={queryResult} error={error} isRunning={isRunning} />
            <div className="flex-1 p-4 overflow-auto min-h-[200px]">
              <ResultTable result={queryResult} />
            </div>

            {/* Findings: back each claim with what the data showed. */}
            <div className="p-4 border-t border-bgap-border bg-bgap-surface/90 space-y-4">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-bgap-gold" />
                <h3 className="text-xs font-bold text-bgap-text uppercase font-mono tracking-wider">Your findings for {mission.client.name}</h3>
              </div>
              {notes.length > 0 && (
                <details className="rounded-xl border border-bgap-gold/30 bg-bgap-gold/5 p-3 text-xs" open>
                  <summary className="cursor-pointer font-semibold text-bgap-gold flex items-center gap-1.5"><FileSearch className="w-3.5 h-3.5" />Case notes ({notes.length})</summary>
                  {notes.map((e) => (
                    <div key={e.id} className="mt-2">
                      <div className="font-semibold text-bgap-text">{e.title}</div>
                      <p className="text-bgap-muted leading-relaxed">{e.text}</p>
                    </div>
                  ))}
                </details>
              )}
              {mission.findings.map((f) => {
                const locked = !hasEvidence(f.evidence);
                return (
                <fieldset key={f.id} className="space-y-1.5" disabled={locked}>
                  <legend className="text-[12px] text-bgap-text font-semibold mb-1">{f.claim}</legend>
                  {locked && (
                    <p className="text-[11px] text-bgap-gold flex items-start gap-1.5 mb-1">
                      <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      Back this claim with field evidence first: find “{evidenceById(f.evidence)?.title ?? 'the evidence'}” near {mission.client.business} (follow the waypoint).
                    </p>
                  )}
                  {f.options.map((o) => (
                    <label
                      key={o.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${locked ? 'opacity-40 cursor-not-allowed ' : ''}${answers[f.id] === o.id ? 'bg-bgap-cyan/10 border-bgap-cyan text-bgap-text font-medium' : 'bg-bgap-card border-bgap-border text-bgap-muted hover:text-bgap-text'}`}
                    >
                      <input type="radio" name={`finding-${f.id}`} id={`finding-${f.id}-${o.id}`} checked={answers[f.id] === o.id} onChange={() => setAnswers((a) => ({ ...a, [f.id]: o.id }))} className="mt-0.5 accent-cyan-400" />
                      <span>{o.text}</span>
                    </label>
                  ))}
                </fieldset>
                );
              })}
              {submitError && <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/30">{submitError}</p>}
            </div>

            {evaluation && (
              <div className="p-4 border-t border-bgap-border bg-bgap-surface">
                <RubricFeedback result={evaluation} onClose={() => setEvaluation(null)} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
