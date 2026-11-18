"use client";

import React, { useEffect } from 'react';
import { FileSearch, X } from 'lucide-react';
import { useGameState } from '../engine/GameState';
import { useCareerStore } from '../ui/phone/useCareer';
import { AudioManager } from '../audio/AudioManager';

/** Shown when you pick up field evidence. Its text is also kept in the terminal's case notes. */
export const EvidenceCard: React.FC = () => {
  const open = useGameState((s) => s.openEvidence);
  const close = useGameState((s) => s.closeEvidence);
  const mission = useCareerStore((s) => s.missions?.find((m) => m.id === open?.missionId));
  const evidence = mission?.evidence?.find((e) => e.id === open?.evidenceId);

  useEffect(() => {
    if (!open) return;
    AudioManager.playUi('confirm');
    const key = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || (e.code === 'KeyE' && !e.repeat)) { e.stopPropagation(); close(); }
    };
    // Capture phase, so E closes the card instead of re-triggering the pickup.
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [open, close]);

  if (!open || !evidence || !mission) return null;
  const needed = mission.findings.filter((f) => f.evidence === evidence.id);
  return (
    <div className="absolute inset-x-0 bottom-8 max-w-xl mx-auto px-4 z-40 pointer-events-auto">
      <div role="dialog" aria-label={evidence.title} className="bg-[#FBF6EA] text-[#2B2118] rounded-2xl p-6 shadow-hud-glass border-2 border-[#E2D3B3] relative">
        <button onClick={close} aria-label="Put it back" className="absolute top-4 right-4 text-[#8A7A62] hover:text-[#2B2118]">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 mb-1 text-[11px] font-mono uppercase tracking-wider text-[#8A6A2E]">
          <FileSearch className="w-4 h-4" /> Evidence · {mission.client.business}
        </div>
        <h2 className="text-lg font-extrabold mb-3">{evidence.title}</h2>
        <p className="text-sm leading-relaxed font-serif">{evidence.text}</p>
        <p className="mt-4 text-xs text-[#6B5B45]">
          Added to your case notes{needed.length ? `. You can now answer: “${needed[0].claim}”` : ''}.
          <span className="ml-1 font-mono">[E] or Esc to close</span>
        </p>
      </div>
    </div>
  );
};
