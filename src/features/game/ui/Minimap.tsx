"use client";

import React from 'react';
import { useGameState } from '../engine/GameState';
import { Navigation } from 'lucide-react';

export const Minimap: React.FC = () => {
  const [px, , pz] = useGameState((s) => s.playerPosition);
  const rotY = useGameState((s) => s.playerRotationY);

  // Map coordinate clamping / scaling
  const mapSize = 96;
  const scale = 0.8;
  const markerX = mapSize / 2 + px * scale;
  const markerY = mapSize / 2 + pz * scale;

  return (
    <div className="relative w-24 h-24 rounded-2xl bg-bgap-dark/90 border border-bgap-border overflow-hidden shadow-hud-glass">
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px]" />

      {/* Waypoint Café Pin */}
      <div
        className="absolute w-2.5 h-2.5 rounded-full bg-bgap-gold shadow-neon-cyan transform -translate-x-1/2 -translate-y-1/2 animate-ping"
        style={{ left: `${mapSize / 2 + 25 * scale}px`, top: `${mapSize / 2 + 15 * scale}px` }}
      />
      <div
        className="absolute w-2 h-2 rounded-full bg-bgap-gold transform -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${mapSize / 2 + 25 * scale}px`, top: `${mapSize / 2 + 15 * scale}px` }}
      />

      {/* Player Directional Arrow */}
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-75"
        style={{
          left: `${markerX}px`,
          top: `${markerY}px`,
          transform: `translate(-50%, -50%) rotate(${(-rotY * 180) / Math.PI}deg)`,
        }}
      >
        <Navigation className="w-3.5 h-3.5 text-bgap-cyan fill-bgap-cyan" />
      </div>
    </div>
  );
};
