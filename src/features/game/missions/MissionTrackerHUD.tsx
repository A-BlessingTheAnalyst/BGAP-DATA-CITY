"use client";

import React from 'react';
import { useGameState } from '../engine/GameState';
import { naira, useCareerStore } from '../ui/phone/useCareer';
import { CheckCircle2, Circle, Target } from 'lucide-react';

/** Objectives for the tracked job, built from its mission file. */
export const MissionTrackerHUD: React.FC = () => {
  const trackedId = useGameState((s) => s.trackedMissionId);
  const missionState = useGameState((s) => s.missionState);
  const completed = useGameState((s) => s.completedMissions);
  const talked = useGameState((s) => s.talkedTo);
  const mission = useCareerStore((s) => s.missions?.find((m) => m.id === trackedId));
  if (!mission) return null;

  const done = completed.includes(mission.id);
  const met = done || talked.includes(mission.id) || (mission.id === 'ch1_cafe_revenue_mystery' && missionState !== 'available');
  const objectives = [
    ...(mission.location.remote ? [] : [{ text: `Meet ${mission.client.name} at ${mission.client.business}`, ok: met }]),
    { text: mission.summary, ok: done },
    { text: `Get paid ${naira(mission.pay)}`, ok: done },
  ];

  return (
    <div className="absolute top-5 right-5 w-52 sm:w-80 max-w-[calc(100vw-2.5rem)] bg-bgap-surface/85 backdrop-blur-md border border-bgap-border rounded-xl p-4 shadow-hud-glass select-none pointer-events-auto">
      <div className="flex items-center justify-between border-b border-bgap-border pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-bgap-cyan" />
          <span className="text-xs font-mono text-bgap-cyan tracking-wider uppercase font-semibold">{done ? 'Completed' : 'Tracking'}</span>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-bgap-card text-bgap-gold border border-bgap-border">Tier {mission.tier} · {mission.skill}</span>
      </div>
      <h3 className="text-sm font-bold text-bgap-text mb-3">{mission.title}</h3>
      <div className="space-y-2">
        {objectives.map((o, i) => (
          <div key={i} className="flex items-start gap-2.5 text-xs">
            {o.ok ? <CheckCircle2 className="w-4 h-4 text-bgap-emerald shrink-0 mt-0.5" /> : <Circle className="w-4 h-4 text-bgap-muted shrink-0 mt-0.5" />}
            <span className={o.ok ? 'line-through text-bgap-muted' : 'text-bgap-text'}>{o.text}</span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-bgap-muted mt-3">Tab opens the DataPhone to switch jobs.</p>
    </div>
  );
};
