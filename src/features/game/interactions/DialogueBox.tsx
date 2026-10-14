"use client";

import React, { useState } from 'react';
import { useGameState } from '../engine/GameState';
import { CAFE_DIALOGUE_TREE } from '../missions/chapter1-cafe/CafeDialogueTree';
import { MessageSquare, ArrowRight, X } from 'lucide-react';

export const DialogueBox: React.FC = () => {
  const [currentNodeId, setCurrentNodeId] = useState('root');
  const closeDialogue = useGameState((s) => s.closeDialogue);
  const openWorkstation = useGameState((s) => s.openWorkstation);
  const setMissionState = useGameState((s) => s.setMissionState);

  const node = CAFE_DIALOGUE_TREE[currentNodeId] || CAFE_DIALOGUE_TREE.root;

  const handleOptionClick = (option: (typeof node.options)[0]) => {
    if (option.action === 'open_terminal') {
      closeDialogue();
      openWorkstation('ws_cafe_laptop');
      setMissionState('analysis');
    } else if (option.action === 'complete_mission') {
      setMissionState('completed');
      closeDialogue();
    } else if (option.nextNodeId) {
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
