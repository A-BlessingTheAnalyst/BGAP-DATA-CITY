"use client";

import React from 'react';
import { useGameState } from '../engine/GameState';
import { CAFE_MISSION } from './chapter1-cafe/CafeMissionDefinition';
import { CheckCircle2, Circle, Target } from 'lucide-react';

export const MissionTrackerHUD: React.FC = () => {
  const missionState = useGameState((s) => s.missionState);

  return (
    <div className="absolute top-5 right-5 w-80 bg-bgap-surface/85 backdrop-blur-md border border-bgap-border rounded-xl p-4 shadow-hud-glass select-none pointer-events-auto">
      <div className="flex items-center justify-between border-b border-bgap-border pb-2 mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-bgap-cyan animate-pulse" />
          <span className="text-xs font-mono text-bgap-cyan tracking-wider uppercase font-semibold">
            Active Mission
          </span>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-bgap-card text-bgap-gold border border-bgap-border">
          {CAFE_MISSION.primarySkill}
        </span>
      </div>

      <h3 className="text-sm font-bold text-bgap-text mb-1">{CAFE_MISSION.title}</h3>
      <p className="text-xs text-bgap-muted mb-3 leading-relaxed">{CAFE_MISSION.briefing.slice(0, 85)}...</p>

      {/* Objectives list */}
      <div className="space-y-2">
        {CAFE_MISSION.objectives.map((obj, i) => {
          const isDone =
            (i === 0 && (missionState === 'analysis' || missionState === 'submitted' || missionState === 'completed')) ||
            (i === 1 && (missionState === 'submitted' || missionState === 'completed')) ||
            (i === 2 && missionState === 'completed');

          return (
            <div key={obj.id} className="flex items-start gap-2.5 text-xs">
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-bgap-emerald shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-4 h-4 text-bgap-muted shrink-0 mt-0.5" />
              )}
              <span className={isDone ? 'line-through text-bgap-muted' : 'text-bgap-text'}>
                {obj.description}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
