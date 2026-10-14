export interface ZoneData {
  id: string;
  name: string;
  district: string;
  description: string;
  spawnCoords: [number, number, number];
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
}

export const CITY_ZONES: Record<string, ZoneData> = {
  academy_plaza: {
    id: 'academy_plaza',
    name: 'BGAP Academy Plaza',
    district: 'Education Hub',
    description: 'The starting grounds where new analysts receive credentials and train.',
    spawnCoords: [0, 0.9, 0],
    bounds: { minX: -20, maxX: 20, minZ: -20, maxZ: 20 },
  },
  cafe_commercial: {
    id: 'cafe_commercial',
    name: "Mama Bisi's Gourmet Café",
    district: 'Commercial Boulevard',
    description: 'A bustling downtown café grappling with discrepancy between sales and revenue.',
    spawnCoords: [25, 0.9, 15],
    bounds: { minX: 15, maxX: 40, minZ: 5, maxZ: 30 },
  },
  financial_district: {
    id: 'financial_district',
    name: 'Meridian Capital Tower',
    district: 'Financial District',
    description: 'Corporate hub featuring high-stakes forecasting and executive boards.',
    spawnCoords: [-35, 0.9, 40],
    bounds: { minX: -50, maxX: -20, minZ: 25, maxZ: 60 },
  },
};
