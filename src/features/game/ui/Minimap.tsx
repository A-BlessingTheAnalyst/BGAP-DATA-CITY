"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Map as MapIcon } from 'lucide-react';
import { useGameState } from '../engine/GameState';
import { playerRuntime } from '../characters/PlayerCharacter';
import { runtimeInput } from '../input/InputManager';
import { CityLayers, MAP_COLORS } from './map/MapLayers';
import { useMapClients, useNavTarget } from '../world/navigation';
import { DISTRICT_INFO, districtAt, pathLength, routeBetween, streetAt, type DistrictId } from '../world/kit/cityPlan';

const SIZE = 168; // px
const SCALE = 0.85; // px per metre (shows ~100 m around you)
const R = SIZE / 2;

/** Heading-up minimap: the city turns with the camera, so "up" is always where you're looking. */
export const Minimap: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const world = useRef<SVGGElement>(null);
  const arrow = useRef<SVGGElement>(null);
  const edge = useRef<SVGGElement>(null);
  const north = useRef<SVGGElement>(null);
  const target = useNavTarget();
  const clients = useMapClients();
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [where, setWhere] = useState<{ district: DistrictId; street: string | null; dist: number | null }>({ district: 'market', street: null, dist: null });
  const setMapOpen = useGameState((s) => s.setMapOpen);

  // GPS route and location text: refreshed a few times a second (cheap: a ~40-node graph).
  useEffect(() => {
    const tick = () => {
      const p = playerRuntime.position;
      // Close by (same block), just head straight there; further away, follow the roads.
      const straight = target ? Math.hypot(target.pos[0] - p.x, target.pos[2] - p.z) : null;
      const r = target && straight! > 30 ? routeBetween([p.x, p.z], [target.pos[0], target.pos[2]]) : null;
      setRoute(r);
      setWhere({ district: districtAt(p.x, p.z), street: streetAt(p.x, p.z)?.name ?? null, dist: r ? pathLength(r) : straight });
    };
    tick();
    const id = window.setInterval(tick, 700);
    return () => window.clearInterval(id);
  }, [target]);

  // Per-frame transform: rotate the world so the camera's forward direction points up.
  useEffect(() => {
    let raf = 0;
    const frame = () => {
      const p = playerRuntime.position, yaw = runtimeInput.yaw;
      // Camera forward on the map (SVG y = −z): (−sin yaw, +cos yaw). Turn it to screen-up.
      const theta = -90 - (Math.atan2(Math.cos(yaw), -Math.sin(yaw)) * 180) / Math.PI;
      world.current?.setAttribute('transform', `translate(${R} ${R}) rotate(${theta}) scale(${SCALE}) translate(${-p.x} ${p.z})`);
      north.current?.setAttribute('transform', `rotate(${theta} ${R} ${R})`);
      const facing = playerRuntime.rotation; // world facing → map vector (sin r, −cos r)
      const a = theta + (Math.atan2(-Math.cos(facing), Math.sin(facing)) * 180) / Math.PI + 90;
      arrow.current?.setAttribute('transform', `translate(${R} ${R}) rotate(${a})`);
      if (edge.current) {
        if (target) {
          const dx = (target.pos[0] - p.x) * SCALE, dy = -(target.pos[2] - p.z) * SCALE;
          const t = (theta * Math.PI) / 180;
          const sx = dx * Math.cos(t) - dy * Math.sin(t), sy = dx * Math.sin(t) + dy * Math.cos(t);
          const d = Math.hypot(sx, sy), lim = R - 10;
          const show = d > lim;
          edge.current.style.display = show ? '' : 'none';
          if (show) edge.current.setAttribute('transform', `translate(${R + (sx / d) * lim} ${R + (sy / d) * lim}) rotate(${(Math.atan2(sy, sx) * 180) / Math.PI + 90})`);
        } else edge.current.style.display = 'none';
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const info = DISTRICT_INFO[where.district];
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => setMapOpen(true)}
        aria-label="Open city map (M)"
        className="relative rounded-full overflow-hidden border-2 border-bgap-border shadow-hud-glass bg-[#0E1524] hover:border-bgap-cyan transition w-[104px] h-[104px] sm:w-[140px] sm:h-[140px] lg:w-[168px] lg:h-[168px] [@media(max-height:500px)]:w-[96px] [@media(max-height:500px)]:h-[96px]"
      >
        <svg width="100%" height="100%" viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <g ref={world}>
            <CityLayers />
            {route && <polyline points={route.map(([x, z]) => `${x},${-z}`).join(' ')} fill="none" stroke={MAP_COLORS.route} strokeWidth={3.2 / SCALE} strokeLinejoin="round" strokeLinecap="round" strokeOpacity={0.9} />}
            {clients.map((c) => <circle key={c.id} cx={c.pos[0]} cy={-c.pos[2]} r={3.2} fill={c.done ? '#64748B' : MAP_COLORS.client} stroke="#0E1524" strokeWidth={1} />)}
            {target && <circle cx={target.pos[0]} cy={-target.pos[2]} r={4.5} fill={MAP_COLORS.target} stroke="#fff" strokeWidth={1.2} />}
          </g>
          {/* Off-screen target chevron */}
          <g ref={edge} style={{ display: 'none' }}>
            <path d="M0,-7 L6,4 L0,1 L-6,4 Z" fill={MAP_COLORS.target} stroke="#0E1524" strokeWidth={1} />
          </g>
          {/* Player */}
          <g ref={arrow}>
            <path d="M0,-8 L6,6 L0,3 L-6,6 Z" fill={MAP_COLORS.player} stroke="#0E1524" strokeWidth={1.2} />
          </g>
          {/* North marker on the rim */}
          <g ref={north}>
            <g transform={`translate(${R} 9)`}>
              <circle r={6.5} fill="#0F1626" stroke="#22304E" />
              <text textAnchor="middle" dominantBaseline="central" fontSize={8} fontWeight={700} fill="#F8FAFC">N</text>
            </g>
          </g>
        </svg>
        <span className="absolute bottom-1.5 right-1/2 translate-x-1/2 flex items-center gap-0.5 text-[9px] font-mono text-bgap-muted bg-bgap-dark/70 rounded px-1">
          <MapIcon className="w-2.5 h-2.5" />M
        </span>
      </button>
      {/* This caption floats directly over the 3D world (no panel behind it), so — like the
          district-entry banner below — it stays fixed light text with a dark drop-shadow for
          legibility against whatever's in the scene, rather than the theme's panel-text token. */}
      {!compact && <div className="w-[150px] lg:w-[190px] text-center leading-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] [@media(max-height:500px)]:hidden">
        <div className="text-[11px] font-bold text-white truncate">{info.name}</div>
        {where.street !== info.name && <div className="text-[10px] text-white/75 truncate">{where.street ?? 'Side street'}</div>}
        {target && where.dist !== null && (
          <div className="text-[10px] font-mono text-bgap-gold truncate">{target.label} · {where.dist < 1000 ? `${Math.round(where.dist / 5) * 5} m` : `${(where.dist / 1000).toFixed(1)} km`}</div>
        )}
      </div>}
    </div>
  );
};

/** "Entering Finance Row" banner when you cross into a new district. */
export const DistrictBanner: React.FC = () => {
  const [shown, setShown] = useState<{ id: DistrictId; at: number } | null>(null);
  useEffect(() => {
    let last: DistrictId | null = null;
    const id = window.setInterval(() => {
      const d = districtAt(playerRuntime.position.x, playerRuntime.position.z);
      if (d !== last) {
        if (last !== null) setShown({ id: d, at: Date.now() });
        last = d;
      }
    }, 400);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (!shown) return;
    const t = window.setTimeout(() => setShown(null), 3200);
    return () => window.clearTimeout(t);
  }, [shown]);
  if (!shown) return null;
  return (
    <div key={shown.at} className="absolute top-24 left-1/2 -translate-x-1/2 text-center pointer-events-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
      <div className="text-[10px] uppercase tracking-[0.3em] text-white/80">Entering</div>
      <div className="text-2xl font-extrabold text-white">{DISTRICT_INFO[shown.id].name}</div>
    </div>
  );
};
