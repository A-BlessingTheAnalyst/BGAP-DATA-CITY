// Data City art direction: a warm Lagos-afternoon commercial city.
// Sun-bleached plaster, rusted corrugated roofs, bright painted signage,
// glass towers in the financial district. Every kit asset pulls colour from here
// so districts read as one place.

export const PALETTE = {
  // Plaster and paint, the default wall colours for houses and shops
  walls: {
    sand: '#E8D3A9',
    ochre: '#D9A441',
    terracotta: '#C8643B',
    cream: '#F2E8D5',
    mint: '#9FD3BE',
    sky: '#8EC5E0',
    blush: '#E7A9A0',
    lilac: '#B8A6D9',
    concrete: '#B9B4AA',
    whitewash: '#F5F3EE',
  },
  roofs: {
    rust: '#8E4A2B',
    rustLight: '#A9603A',
    slate: '#4A5563',
    zincBlue: '#5A7FA3',
    clay: '#B0553A',
    green: '#3F6B4E',
  },
  trim: {
    white: '#F8F6F0',
    charcoal: '#2B2F36',
    teak: '#6B4226',
    steel: '#8A939E',
    gold: '#D4A017',
  },
  glass: {
    day: '#7FA9C4',
    tower: '#3C6E91',
    towerDark: '#1E3A5C',
    lit: '#FFE3A3',
    shop: '#BFD9E6',
  },
  ground: {
    asphalt: '#3A3F47',
    kerb: '#C9C3B8',
    paving: '#B8AA92',
    laterite: '#B8693F',
    grass: '#6E9B4A',
    soil: '#7A5236',
  },
  nature: {
    leaf: '#3F7D3A',
    leafLight: '#5E9E45',
    palm: '#4C8A3A',
    trunk: '#6E5238',
    flower: '#E0457B',
  },
  // Brand colours used on signage and vehicle livery (all fictional companies)
  brand: {
    bgap: '#00B8C9',
    meridian: '#1F3A6B',
    meridianGold: '#D4A017',
    kora: '#E8562A',
    lumen: '#7B3FE4',
    vantage: '#0E8F6E',
    okeke: '#D62839',
    atlas: '#F2B705',
  },
  vehicles: ['#C0392B', '#F4F4F2', '#1F2A38', '#7D8A96', '#2E6DA4', '#D8C7A3', '#3B7A57', '#9B2D30'],
  skin: ['#4A2C1D', '#5C3A24', '#6F4630', '#87573A', '#9C6A46', '#B07D55', '#C99A72'],
  fabric: {
    ankaraRed: '#C4302B',
    ankaraBlue: '#1F5FA8',
    ankaraYellow: '#F2B134',
    ankaraGreen: '#2F8F5B',
    indigo: '#2D3A6B',
    white: '#F3F1EC',
    khaki: '#B9A57C',
    navy: '#1D2B45',
    black: '#1B1C20',
    maroon: '#7A1F2B',
    purple: '#6A3D9A',
    teal: '#13837A',
  },
} as const;

/** Deterministic pseudo-random so kit assets look the same on every load. */
export function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function pick<T>(arr: readonly T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length) % arr.length];
}
