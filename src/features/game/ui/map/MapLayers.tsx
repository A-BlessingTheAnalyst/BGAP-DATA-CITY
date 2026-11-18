'use client';
import { memo } from 'react';
import { BLOCKS, DISTRICT_INFO, ROADS, ROAD_RECTS, TILE, cityPlan, lotRect } from '../../world/kit/cityPlan';

// SVG drawing of the city in world metres. Map north is +Z, so SVG y = −z.
// Shared by the minimap (rotated, zoomed in) and the full city map.

export const MAP_COLORS = {
  ground: '#0E1524',
  road: '#3C4A63',
  mainRoad: '#52617E',
  building: '#25324A',
  landmark: '#33486B',
  park: '#183427',
  route: '#22D3EE',
  target: '#F59E0B',
  client: '#10B981',
  player: '#00F2FE',
};

/** Static city layers: district pads, roads, buildings. Never re-renders. */
export const CityLayers = memo(function CityLayers({ detail = true }: { detail?: boolean }) {
  const { lots } = cityPlan();
  return (
    <g>
      {BLOCKS.map((b) => (
        <rect key={`${b.i}${b.j}`} x={b.x - b.w / 2} y={-b.z - b.d / 2} width={b.w} height={b.d} fill={b.park ? MAP_COLORS.park : DISTRICT_INFO[b.district].map} fillOpacity={b.park ? 1 : 0.13} />
      ))}
      {ROAD_RECTS.map((r, i) => (
        <rect key={i} x={r.x - r.w / 2} y={-r.z - r.d / 2} width={r.w} height={r.d} fill={ROADS[i].main ? MAP_COLORS.mainRoad : MAP_COLORS.road} />
      ))}
      {detail && lots.map((l) => {
        const r = lotRect(l);
        return <rect key={l.id} x={r.x - r.w / 2} y={-r.z - r.d / 2} width={r.w} height={r.d} fill={l.kind === 'kit' ? MAP_COLORS.building : MAP_COLORS.landmark} rx={0.6} />;
      })}
    </g>
  );
});

/** Street names written along each road (full map). */
export const StreetNames = memo(function StreetNames({ size = 5 }: { size?: number }) {
  return (
    <g fontFamily="Outfit, system-ui, sans-serif" fontWeight={600} fill="#CBD5E1" fillOpacity={0.75} fontSize={size}>
      {ROADS.map((r) => {
        // Label each road between its first two junctions (clear of the crossings).
        const at = r.from + (r.to - r.from) * 0.31;
        return r.axis === 'z'
          ? <text key={r.id} x={r.at} y={-at} transform={`rotate(-90 ${r.at} ${-at})`} textAnchor="middle" dominantBaseline="central" fontSize={size * 0.9}>{r.name}</text>
          : <text key={r.id} x={at} y={-r.at} textAnchor="middle" dominantBaseline="central" fontSize={size * 0.9}>{r.name}</text>;
      })}
    </g>
  );
});

export const ROAD_WIDTH = TILE;
