"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, X, Crosshair, Trash2 } from 'lucide-react';
import { useGameState } from '../../engine/GameState';
import { playerRuntime } from '../../characters/PlayerCharacter';
import { AudioManager } from '../../audio/AudioManager';
import { resetInput } from '../../input/InputManager';
import { CityLayers, MAP_COLORS, StreetNames } from './MapLayers';
import { useMapClients, useNavTarget } from '../../world/navigation';
import { BLOCKS, CITY_BOUNDS, DISTRICT_INFO, mapPlaces, pathLength, routeBetween, type DistrictId } from '../../world/kit/cityPlan';

const B = CITY_BOUNDS;
const W = B.maxX - B.minX, H = B.maxZ - B.minZ;

/** District label positions: the centre of each district's blocks. */
function districtLabels() {
  const acc = new Map<DistrictId, { x: number; z: number; n: number }>();
  for (const b of BLOCKS) {
    const a = acc.get(b.district) ?? { x: 0, z: 0, n: 0 };
    acc.set(b.district, { x: a.x + b.x, z: a.z + b.z, n: a.n + 1 });
  }
  // Label on the district's block nearest its centroid (a centroid can land on a junction).
  return [...acc].map(([id, a]) => {
    const cx = a.x / a.n, cz = a.z / a.n;
    const b = BLOCKS.filter((k) => k.district === id).sort((p, q) => (p.x - cx) ** 2 + (p.z - cz) ** 2 - ((q.x - cx) ** 2 + (q.z - cz) ** 2))[0];
    return { id, x: b.x, z: b.z };
  });
}

/**
 * Full-screen city map (M). Drag to pan, wheel or buttons to zoom.
 * Click anywhere to drop a pin (GPS routes to it); click a client to track their job.
 */
export const CityMap: React.FC = () => {
  const open = useGameState((s) => s.isMapOpen);
  const setOpen = useGameState((s) => s.setMapOpen);
  const pin = useGameState((s) => s.customWaypoint);
  const setPin = useGameState((s) => s.setCustomWaypoint);
  const track = useGameState((s) => s.trackMission);
  const target = useNavTarget();
  const clients = useMapClients();
  const places = useMemo(() => mapPlaces(), []);
  const labels = useMemo(() => districtLabels(), []);
  const svg = useRef<SVGSVGElement>(null);
  // View box in world metres (x, −z).
  const [view, setView] = useState({ cx: 0, cy: 0, w: 260 });
  const [player, setPlayer] = useState<{ x: number; z: number; r: number }>({ x: 0, z: 0, r: 0 });
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  // M toggles, Esc closes. Ignored while typing or inside the terminal/dialogue.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea, select, [contenteditable="true"]')) return;
      const s = useGameState.getState();
      if (e.code === 'KeyM' && !e.repeat && !s.isWorkstationActive && !s.isDialogueActive) {
        if (!s.isMapOpen) { resetInput(); AudioManager.playUi('open'); } else AudioManager.playUi('close');
        s.setMapOpen(!s.isMapOpen);
      } else if (e.code === 'Escape' && s.isMapOpen) {
        AudioManager.playUi('close');
        s.setMapOpen(false);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  // Centre on the player each time the map opens; follow their position while open.
  useEffect(() => {
    if (!open) return;
    const p = playerRuntime.position;
    setView({ cx: p.x, cy: -p.z, w: 260 });
    const id = window.setInterval(() => setPlayer({ x: playerRuntime.position.x, z: playerRuntime.position.z, r: playerRuntime.rotation }), 150);
    return () => window.clearInterval(id);
  }, [open]);

  const route = useMemo(() => (open && target && Math.hypot(target.pos[0] - player.x, target.pos[2] - player.z) > 30 ? routeBetween([player.x, player.z], [target.pos[0], target.pos[2]]) : null), [open, target, player.x, player.z]);

  if (!open) return null;

  const rect = () => svg.current!.getBoundingClientRect();
  const aspect = () => { const r = rect(); return r.height / r.width; };
  const toWorld = (clientX: number, clientY: number) => {
    const r = rect(), h = view.w * aspect();
    return [view.cx - view.w / 2 + ((clientX - r.left) / r.width) * view.w, view.cy - h / 2 + ((clientY - r.top) / r.height) * h] as const;
  };
  const clampView = (v: typeof view) => ({
    w: Math.max(80, Math.min(W * 1.1, v.w)),
    cx: Math.max(B.minX, Math.min(B.maxX, v.cx)),
    cy: Math.max(-B.maxZ, Math.min(-B.minZ, v.cy)),
  });
  const zoom = (f: number) => setView((v) => clampView({ ...v, w: v.w * f }));

  const onDown = (e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY, moved: false }; (e.target as Element).setPointerCapture?.(e.pointerId); };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    d.moved = true;
    const k = view.w / rect().width;
    setView((v) => clampView({ ...v, cx: v.cx - dx * k, cy: v.cy - dy * k }));
    d.x = e.clientX; d.y = e.clientY;
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved) return;
    const [x, y] = toWorld(e.clientX, e.clientY);
    // A click near a client tracks their job; anywhere else drops a pin.
    const hit = clients.find((c) => Math.hypot(c.pos[0] - x, -c.pos[2] - y) < view.w * 0.02 + 3);
    if (hit && !hit.done) { track(hit.id); setPin(null); AudioManager.playUi('select'); return; }
    if (x < B.minX || x > B.maxX || -y < B.minZ || -y > B.maxZ) return;
    setPin([x, -y]);
    AudioManager.playUi('select');
  };

  const h = view.w * (typeof window !== 'undefined' ? window.innerHeight / window.innerWidth : 0.6);
  const vb = `${view.cx - view.w / 2} ${view.cy - h / 2} ${view.w} ${h}`;
  const k = view.w / 260; // label scale with zoom
  const dist = route ? pathLength(route) : target ? Math.hypot(target.pos[0] - player.x, target.pos[2] - player.z) : null;

  return (
    <div className="absolute inset-0 z-40 bg-[#070B13]/95 pointer-events-auto select-none" role="dialog" aria-label="City map">
      <svg
        ref={svg}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        viewBox={vb}
        preserveAspectRatio="xMidYMid slice"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onWheel={(e) => zoom(e.deltaY > 0 ? 1.15 : 0.87)}
      >
        <rect x={B.minX} y={-B.maxZ} width={W} height={H} fill={MAP_COLORS.ground} stroke="#334155" strokeWidth={1.5 * k} strokeDasharray={`${6 * k} ${4 * k}`} />
        <CityLayers />
        <StreetNames size={4.2 * Math.max(0.7, k)} />
        {/* District names */}
        {labels.map((l) => (
          <text key={l.id} x={l.x} y={-l.z} textAnchor="middle" dominantBaseline="central" fontSize={6.2 * k} fontWeight={800} fill={DISTRICT_INFO[l.id].map} fillOpacity={0.9} style={{ letterSpacing: 0.8 * k, paintOrder: 'stroke' }} stroke="#070B13" strokeWidth={1.8 * k}>
            {DISTRICT_INFO[l.id].name.toUpperCase()}
          </text>
        ))}
        {/* Landmarks and story spots */}
        {places.map((p) => (
          <g key={p.name + p.x} transform={`translate(${p.x} ${-p.z})`}>
            <circle r={2.2 * k} fill={p.kind === 'market' ? '#F8FAFC' : '#94A3B8'} />
            <text y={-4 * k} textAnchor="middle" fontSize={4.4 * k} fill="#E2E8F0" style={{ paintOrder: 'stroke' }} stroke="#070B13" strokeWidth={1.4 * k}>{p.name}</text>
          </g>
        ))}
        {route && <polyline points={route.map(([x, z]) => `${x},${-z}`).join(' ')} fill="none" stroke={MAP_COLORS.route} strokeWidth={3 * k} strokeLinejoin="round" strokeLinecap="round" />}
        {/* Clients */}
        {clients.map((c) => (
          <g key={c.id} transform={`translate(${c.pos[0]} ${-c.pos[2]})`} className="cursor-pointer">
            <circle r={4 * k} fill={c.done ? '#475569' : MAP_COLORS.client} stroke="#070B13" strokeWidth={1.2 * k} />
            <text y={8.5 * k} textAnchor="middle" fontSize={4.4 * k} fontWeight={700} fill={c.done ? '#94A3B8' : '#A7F3D0'} style={{ paintOrder: 'stroke' }} stroke="#070B13" strokeWidth={1.4 * k}>{c.name}{c.done ? ' ✓' : ''}</text>
          </g>
        ))}
        {target && (
          <g transform={`translate(${target.pos[0]} ${-target.pos[2]})`}>
            <circle r={6 * k} fill="none" stroke={MAP_COLORS.target} strokeWidth={1.5 * k} />
            <circle r={2.6 * k} fill={MAP_COLORS.target} />
          </g>
        )}
        {/* Player */}
        <g transform={`translate(${player.x} ${-player.z}) rotate(${(Math.atan2(-Math.cos(player.r), Math.sin(player.r)) * 180) / Math.PI + 90}) scale(${k})`}>
          <circle r={6} fill={MAP_COLORS.player} fillOpacity={0.15} />
          <path d="M0,-4.5 L3.2,3.2 L0,1.6 L-3.2,3.2 Z" fill={MAP_COLORS.player} stroke="#070B13" strokeWidth={1} />
        </g>
      </svg>

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-3 pointer-events-none">
        <div className="bg-bgap-surface/90 border border-bgap-border rounded-xl px-4 py-3 shadow-hud-glass pointer-events-auto">
          <div className="text-sm font-extrabold text-bgap-text">Data City</div>
          <div className="text-[11px] text-bgap-muted">Click to drop a pin · click a client to track their job · drag to pan · scroll to zoom</div>
          {target && (
            <div className="mt-2 text-xs flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-bgap-gold" />
              <span className="text-bgap-text font-semibold">{target.label}</span>
              {dist !== null && <span className="font-mono text-bgap-gold">{Math.round(dist)} m{route ? ' by road' : ''}</span>}
            </div>
          )}
        </div>
        <div className="flex gap-2 pointer-events-auto">
          <button onClick={() => { const p = playerRuntime.position; setView((v) => ({ ...v, cx: p.x, cy: -p.z })); }} className="h-10 px-3 rounded-xl bg-bgap-surface/90 border border-bgap-border text-bgap-muted hover:text-bgap-text flex items-center gap-1.5 text-xs" aria-label="Centre on me">
            <Crosshair className="w-4 h-4" />Me
          </button>
          {pin && (
            <button onClick={() => { setPin(null); AudioManager.playUi('close'); }} className="h-10 px-3 rounded-xl bg-bgap-surface/90 border border-bgap-border text-bgap-muted hover:text-bgap-text flex items-center gap-1.5 text-xs">
              <Trash2 className="w-4 h-4" />Clear pin
            </button>
          )}
          <button onClick={() => zoom(0.8)} className="w-10 h-10 rounded-xl bg-bgap-surface/90 border border-bgap-border text-bgap-text text-lg" aria-label="Zoom in">+</button>
          <button onClick={() => zoom(1.25)} className="w-10 h-10 rounded-xl bg-bgap-surface/90 border border-bgap-border text-bgap-text text-lg" aria-label="Zoom out">−</button>
          <button onClick={() => { setOpen(false); AudioManager.playUi('close'); }} className="w-10 h-10 rounded-xl bg-bgap-surface/90 border border-bgap-border text-bgap-muted hover:text-bgap-text flex items-center justify-center" aria-label="Close map (M)">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-bgap-surface/90 border border-bgap-border rounded-xl px-3 py-2 text-[11px] text-bgap-muted flex flex-wrap gap-x-4 gap-y-1 max-w-[calc(100%-2rem)] pointer-events-none">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: MAP_COLORS.player }} />You</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: MAP_COLORS.client }} />Client</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: MAP_COLORS.target }} />Destination</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-1 rounded" style={{ background: MAP_COLORS.route }} />GPS route</span>
        <span className="text-bgap-muted/70">M or Esc to close</span>
      </div>
    </div>
  );
};
