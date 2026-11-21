"use client";

import React from 'react';
import { useGameState } from '../engine/GameState';
import { naira, useCareerStore } from '../ui/phone/useCareer';
import { useHudPrefs } from '../ui/hudPrefs';
import { CheckCircle2, ChevronDown, Circle, Target } from 'lucide-react';

/** Objectives for the tracked job: a one-line pill with the *next* step; tap to expand. */
export const MissionTrackerHUD: React.FC = () => {
  const trackedId = useGameState((s) => s.trackedMissionId);
  const missionState = useGameState((s) => s.missionState);
  const completed = useGameState((s) => s.completedMissions);
  const talked = useGameState((s) => s.talkedTo);
  const mission = useCareerStore((s) => s.missions?.find((m) => m.id === trackedId));
  const show = useHudPrefs((s) => s.showTracker);
  const expanded = useHudPrefs((s) => s.trackerExpanded);
  const setPrefs = useHudPrefs((s) => s.set);
  if (!mission || !show) return null;

  const done = completed.includes(mission.id);
  const met = done || talked.includes(mission.id) || (mission.id === 'ch1_cafe_revenue_mystery' && missionState !== 'available');
  const objectives = [
    ...(mission.location.remote ? [] : [{ text: `Meet ${mission.client.name} at ${mission.client.business}`, ok: met }]),
    { text: mission.summary, ok: done },
    { text: `Get paid ${naira(mission.pay)}`, ok: done },
  ];
  const next = objectives.find((o) => !o.ok);

  return (
    <div className="bg-bgap-surface/85 backdrop-blur-md border border-bgap-border rounded-xl shadow-hud-glass select-none pointer-events-auto w-[min(70vw,320px)]">
      <button
        onClick={() => setPrefs({ trackerExpanded: !expanded })}
        aria-expanded={expanded}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left"
      >
        <Target className="w-3.5 h-3.5 text-bgap-cyan shrink-0" />
        <span className="flex-1 min-w-0 text-[11px] leading-tight">
          <span className="block font-bold text-bgap-text truncate">{mission.title}</span>
          {!expanded && <span className="block text-bgap-muted truncate">{done ? 'Completed' : next?.text}</span>}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-bgap-muted shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-bgap-border space-y-1.5">
          <div className="text-[10px] font-mono text-bgap-gold">Tier {mission.tier} · {mission.skill}</div>
          {objectives.map((o, i) => (
            <div key={i} className="flex items-start gap-2 text-[11px]">
              {o.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-bgap-emerald shrink-0 mt-0.5" /> : <Circle className="w-3.5 h-3.5 text-bgap-muted shrink-0 mt-0.5" />}
              <span className={o.ok ? 'line-through text-bgap-muted' : 'text-bgap-text'}>{o.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
