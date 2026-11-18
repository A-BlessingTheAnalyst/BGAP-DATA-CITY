"use client";

import React, { useState } from 'react';
import { useGameState } from '../engine/GameState';
import { CAFE_DIALOGUE_TREE, GUARD_DIALOGUE_TREE, DialogueNode } from './DialogueTrees';
import { MessageSquare, ArrowRight, X } from 'lucide-react';
import { naira, useCareerStore } from '../ui/phone/useCareer';

/** Shared look for every dialogue panel. */
function Panel({ speaker, text, options, onClose }: { speaker: string; text: string; options: { text: string; onClick: () => void }[]; onClose: () => void }) {
  return (
    <div className="absolute inset-x-0 bottom-8 max-w-2xl mx-auto px-4 z-40 select-none pointer-events-auto">
      <div className="bg-bgap-surface/95 border border-bgap-border backdrop-blur-lg rounded-2xl p-6 shadow-hud-glass relative">
        <button onClick={onClose} aria-label="End conversation" className="absolute top-4 right-4 text-bgap-muted hover:text-bgap-text transition"><X className="w-5 h-5" /></button>
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-bgap-cyan" />
          <span className="text-sm font-bold text-bgap-cyan tracking-wider uppercase font-mono">{speaker}</span>
        </div>
        <p className="text-base text-bgap-text leading-relaxed mb-6">{text}</p>
        <div className="space-y-2.5">
          {options.map((o, i) => (
            <button key={i} onClick={o.onClick} className="w-full text-left px-4 py-3 rounded-xl bg-bgap-card hover:bg-bgap-border/60 border border-bgap-border transition-all flex items-center justify-between group">
              <span className="text-sm font-medium text-bgap-text group-hover:text-bgap-cyan transition">{o.text}</span>
              <ArrowRight className="w-4 h-4 text-bgap-muted group-hover:text-bgap-cyan transition transform group-hover:translate-x-1" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Any client defined in a mission file: brief, then offer the job; thanks once it's paid. */
function ClientDialogue({ missionId }: { missionId: string }) {
  const mission = useCareerStore((s) => s.missions?.find((m) => m.id === missionId));
  const done = useGameState((s) => s.completedMissions.includes(missionId));
  const closeDialogue = useGameState((s) => s.closeDialogue);
  const openWorkstation = useGameState((s) => s.openWorkstation);
  const markTalkedTo = useGameState((s) => s.markTalkedTo);
  const trackMission = useGameState((s) => s.trackMission);
  const [page, setPage] = useState(0);
  if (!mission) return <Panel speaker="…" text="…" options={[{ text: 'Leave', onClick: closeDialogue }]} onClose={closeDialogue} />;
  const name = mission.client.name;
  if (done) return <Panel speaker={name} text={mission.client.thanks} options={[{ text: 'Glad to help.', onClick: closeDialogue }]} onClose={closeDialogue} />;
  const lines = mission.client.brief;
  if (page < lines.length - 1) return <Panel speaker={name} text={lines[page]} options={[{ text: 'Go on…', onClick: () => setPage(page + 1) }]} onClose={closeDialogue} />;
  return (
    <Panel
      speaker={name}
      text={`${lines[lines.length - 1]} I'll pay ${naira(mission.pay)}.`}
      options={[
        { text: "Deal. Let me look at the data.", onClick: () => { markTalkedTo(missionId); trackMission(missionId); closeDialogue(); openWorkstation(`ws:${missionId}`, missionId); } },
        { text: 'Not right now.', onClick: () => { markTalkedTo(missionId); closeDialogue(); } },
      ]}
      onClose={closeDialogue}
    />
  );
}

export const DialogueBox: React.FC = () => {
  const activeNpcId = useGameState((s) => s.activeNpcId);
  if (activeNpcId?.startsWith('client:')) return <ClientDialogue missionId={activeNpcId.slice('client:'.length)} />;
  return <StoryDialogue />;
};

/** Hand-written trees for the Chapter 1 café and the Academy guard. */
const StoryDialogue: React.FC = () => {
  const activeNpcId = useGameState((s) => s.activeNpcId);
  const missionState = useGameState((s) => s.missionState);
  const closeDialogue = useGameState((s) => s.closeDialogue);
  const openWorkstation = useGameState((s) => s.openWorkstation);
  const setMissionState = useGameState((s) => s.setMissionState);

  // Select appropriate dialogue tree based on interacting NPC
  const isGuard = activeNpcId === 'npc_guard_academy';
  const tree = isGuard ? GUARD_DIALOGUE_TREE : CAFE_DIALOGUE_TREE;

  // Determine starting node
  const initialNodeId = (() => {
    if (isGuard) return 'root';
    if (missionState === 'completed') return 'debrief_success';
    if (missionState === 'analysis') return 'waiting_analysis';
    return 'root';
  })();

  const [currentNodeId, setCurrentNodeId] = useState(initialNodeId);
  const node: DialogueNode = tree[currentNodeId] || tree.root;

  const handleOptionClick = (option: (typeof node.options)[0]) => {
    if (option.action === 'open_terminal') {
      closeDialogue();
      openWorkstation('ws_cafe_laptop');
      if (missionState === 'available') {
        setMissionState('active');
      }
    } else if (option.action === 'close') {
      closeDialogue();
    } else if (option.nextNodeId) {
      // Hearing the brief starts the case, so the patio laptop opens even if you walk away now.
      if (!isGuard && option.nextNodeId === 'investigate' && missionState === 'available') setMissionState('active');
      setCurrentNodeId(option.nextNodeId);
    } else {
      closeDialogue();
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-8 max-w-2xl mx-auto px-4 z-40 select-none pointer-events-auto animate-float">
      <div className="bg-bgap-surface/95 border border-bgap-border backdrop-blur-lg rounded-2xl p-6 shadow-hud-glass relative">
        <button
          onClick={closeDialogue}
          className="absolute top-4 right-4 text-bgap-muted hover:text-bgap-text transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Speaker Name Tag */}
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-bgap-cyan" />
          <span className="text-sm font-bold text-bgap-cyan tracking-wider uppercase font-mono">
            {node.speaker}
          </span>
        </div>

        {/* Dialogue Body */}
        <p className="text-base text-bgap-text leading-relaxed mb-6">{node.text}</p>

        {/* Options */}
        <div className="space-y-2.5">
          {node.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleOptionClick(opt)}
              className="w-full text-left px-4 py-3 rounded-xl bg-bgap-card hover:bg-bgap-border/60 border border-bgap-border transition-all flex items-center justify-between group"
            >
              <span className="text-sm font-medium text-bgap-text group-hover:text-bgap-cyan transition">
                {opt.text}
              </span>
              <ArrowRight className="w-4 h-4 text-bgap-muted group-hover:text-bgap-cyan transition transform group-hover:translate-x-1" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
