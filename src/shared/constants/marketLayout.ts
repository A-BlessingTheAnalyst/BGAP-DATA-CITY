// World positions of Chapter 1 story points inside Market Boulevard
// (see features/game/world/kit/district.tsx). Café sits on the north-east corner,
// its patio facing the boulevard.
export const MARKET_LAYOUT = {
  spawn: [-7, 0.95, -14] as [number, number, number],
  cafe: { laptop: [11.4, 0, 60] as [number, number, number], owner: [12.6, 0, 53.5] as [number, number, number] },
  guard: [-7.5, 0, -18] as [number, number, number],
  /** Zee Fabrics Tailoring counter (Phase B shop), on the west sidewalk past the fabric shop. */
  tailor: [-7.4, 0, 31.6] as [number, number, number],
  /** Phase D: the player's garage spot, where a bought/called car parks. East sidewalk near the kiosk. */
  garage: [9.5, 0, -16] as [number, number, number],
  /** Phase F: the Airfield helipad in City Gateway (south block), where a bought/called chopper parks. */
  airfield: [205, 0, -226] as [number, number, number],
};
