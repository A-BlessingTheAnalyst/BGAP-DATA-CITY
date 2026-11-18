'use client';
import type { ReactNode } from 'react';
import { PALETTE } from './palette';
import * as B from './buildings';
import * as V from './vehicles';
import { CHARACTERS } from './characters';
import { CastMember } from './CastMember';
import { WaterTank, Generator, PalmTree, ShadeTree, UtilityPole, Planter, FlagPole } from './parts';
import { KIT_INDEX, KitModel, KitRef, kitSize } from './KitModel';
import { ModularBuilding, ModularSpec } from './modular';

const MERIDIAN_BLOCK: ModularSpec = { bays: 8, depth: 6, floors: 4, window: 'Brick_Window_Trim', shopfront: 'Metal_FirstFloor_Window', cornice: 'Cornice_Trim_Center', sign: { text: 'MERIDIAN CAPITAL', sub: 'Bank • ATM inside', bg: '#1F3A6B', fg: '#D4A017' } };

// The Data City world bible: districts, and every asset that builds them.
// The Asset Lab (/game/kit) renders straight from this list, so it is always current.

export type DistrictId = 'academy' | 'market' | 'finance' | 'tech' | 'gardens' | 'gateway';

export interface District {
  id: DistrictId;
  name: string;
  mood: string;
  chapters: string;
  palette: string[];
  skill: string;
}

export const DISTRICTS: District[] = [
  { id: 'academy', name: 'Academy Quarter', mood: 'Clean civic plaza, palms and flags. Where every cadet starts.', chapters: 'Tutorial', skill: 'Navigation, first queries', palette: [PALETTE.walls.whitewash, PALETTE.brand.bgap, PALETTE.ground.paving, PALETTE.nature.palm] },
  { id: 'market', name: 'Market Boulevard', mood: 'Loud, bright, crowded. Painted signs, generators humming, minibuses calling routes.', chapters: 'Chapter 1: The Café Revenue Mystery', skill: 'SQL filtering and aggregation', palette: [PALETTE.walls.mint, PALETTE.walls.terracotta, PALETTE.fabric.ankaraYellow, PALETTE.roofs.rust] },
  { id: 'finance', name: 'Finance Row', mood: 'Glass towers, polished granite, security guards and the hush of money.', chapters: 'Chapter 2: The Banker’s Ledger', skill: 'JOINs and window functions', palette: [PALETTE.brand.meridian, PALETTE.brand.meridianGold, PALETTE.glass.tower, PALETTE.walls.cream] },
  { id: 'tech', name: 'Tech Park', mood: 'Fenced campuses, server hum, cyan light strips. Night shifts.', chapters: 'Chapters 3–4: Outage logs, delivery routes', skill: 'Time series, Python', palette: ['#2A3340', '#00B8C9', PALETTE.brand.lumen, PALETTE.brand.kora] },
  { id: 'gardens', name: 'Ilé Gardens', mood: 'Residential estate. Compound walls, shade trees, kids walking home from school.', chapters: 'Chapter 5: The Clinic Survey', skill: 'Data cleaning, survey analysis', palette: [PALETTE.walls.sand, PALETTE.walls.sky, PALETTE.roofs.clay, PALETTE.nature.leaf] },
  { id: 'gateway', name: 'City Gateway', mood: 'The main road into the city: arch, billboards, filling station.', chapters: 'All chapters', skill: '—', palette: [PALETTE.walls.terracotta, PALETTE.brand.atlas, PALETTE.ground.asphalt, PALETTE.trim.gold] },
];

export type Category = 'Landmarks' | 'Houses' | 'Shops & market' | 'Schools & civic' | 'Banks & companies' | 'Vehicles' | 'Characters' | 'Street props' | 'Library';

export interface KitAsset {
  id: string;
  name: string;
  category: Category;
  district: DistrictId | 'any';
  description: string;
  footprint: [number, number]; // metres, width × depth
  height: number; // metres
  render: () => ReactNode;
  /** Where the geometry comes from: 'Original' or a third-party pack. */
  source?: string;
  licence?: string;
}

const A = (a: KitAsset) => a;

export const KIT: KitAsset[] = [
  // Landmarks
  A({ id: 'data_spire', name: 'The Data Spire', category: 'Landmarks', district: 'academy', footprint: [14, 14], height: 18, description: 'Centrepiece monument in Academy Plaza. Glowing data rings orbit a faceted spire over a fountain. The player spawns facing it.', render: () => <B.DataSpire /> }),
  A({ id: 'clock_tower', name: 'Unity Clock Tower', category: 'Landmarks', district: 'gardens', footprint: [18, 18], height: 15.5, description: 'Four-faced clock on the roundabout where Ilé Gardens meets Market Boulevard. A natural meeting point and waypoint.', render: () => <B.ClockTower /> }),
  A({ id: 'city_gate', name: 'City Gate', category: 'Landmarks', district: 'gateway', footprint: [21, 3], height: 10.6, description: '"Welcome to Data City" arch over the main road in. Marks the edge of the playable map.', render: () => <B.CityGate /> }),
  A({ id: 'ped_bridge', name: 'Pedestrian bridge', category: 'Landmarks', district: 'finance', footprint: [25, 7], height: 7.5, description: 'Footbridge over the boulevard, carrying a Lumen Telecom banner. Gives a high view over Finance Row.', render: () => <B.PedestrianBridge /> }),
  // Houses
  A({ id: 'bungalow', name: 'Family bungalow', category: 'Houses', district: 'gardens', footprint: [16, 14], height: 6, description: 'Single-storey house with veranda, hipped roof, compound wall, steel gate, rooftop water tank and generator.', render: () => <B.Bungalow /> }),
  A({ id: 'bungalow_blue', name: 'Bungalow (blue variant)', category: 'Houses', district: 'gardens', footprint: [16, 14], height: 6, description: 'Same plan, recoloured. Mix colour variants so streets don’t look copy-pasted.', render: () => <B.Bungalow wall={PALETTE.walls.sky} roof={PALETTE.roofs.rust} gate="#7A1F2B" seed={9} /> }),
  A({ id: 'duplex', name: 'Duplex', category: 'Houses', district: 'gardens', footprint: [17, 16], height: 8.8, description: 'Two-storey estate house with balcony, carport and AC units.', render: () => <B.Duplex /> }),
  A({ id: 'apartments', name: 'Ilé Gardens Flats', category: 'Houses', district: 'gardens', footprint: [22, 15], height: 14, description: 'Four-storey block of flats: stacked balconies, laundry lines, louvred stair core and a row of water tanks.', render: () => <B.ApartmentBlock /> }),
  // Shops & market
  A({ id: 'cafe_bisi', name: 'Mama Bisi’s Café', category: 'Shops & market', district: 'market', footprint: [18, 14], height: 6.5, description: 'Chapter 1 location. Warm glowing shopfront, striped awning, patio tables and the laptop where the investigation happens.', render: () => <B.CafeBisi /> }),
  A({ id: 'shop_row', name: 'Shop row (4 units)', category: 'Shops & market', district: 'market', footprint: [18, 12], height: 9, description: 'Lock-up shops with a residence above: phone repairs, pharmacy, a food stall, POS. Half-open shutters, awnings, lightbox signs.', render: () => <B.ShopRow /> }),
  A({ id: 'shop_row_b', name: 'Shop row (variant)', category: 'Shops & market', district: 'market', footprint: [18, 12], height: 9, description: 'Barber, printer, fabrics and provisions in a terracotta terrace.', render: () => <B.ShopRow start={4} wall={PALETTE.walls.blush} seed={13} /> }),
  A({ id: 'market', name: 'Open market', category: 'Shops & market', district: 'market', footprint: [15, 9], height: 3, description: 'Timber stalls under umbrellas with produce. The busiest crowd spot in the city.', render: () => <B.MarketStalls /> }),
  A({ id: 'kiosk', name: 'Baba Sola’s kiosk', category: 'Shops & market', district: 'market', footprint: [3, 3], height: 3.3, description: 'Container kiosk for airtime, drinks and POS cash-outs. A rumour source in several chapters.', render: () => <B.Kiosk /> }),
  A({ id: 'petrol', name: 'Atlas Fuel station', category: 'Shops & market', district: 'gateway', footprint: [26, 20], height: 7, description: 'Canopy, pumps, forecourt shop and a price totem. Fuel price data can feed a later chapter.', render: () => <B.PetrolStation /> }),
  // Schools & civic
  A({ id: 'academy', name: 'BGAP Academy', category: 'Schools & civic', district: 'academy', footprint: [44, 26], height: 12.5, description: 'Player’s home base. Three storeys of classrooms on open corridors, a tall entrance portal, flagpoles and palms.', render: () => <B.AcademyCampus /> }),
  A({ id: 'primary', name: 'Sunrise Primary School', category: 'Schools & civic', district: 'gardens', footprint: [30, 22], height: 5.2, description: 'Single-storey classrooms around a laterite play yard with swings and goalposts.', render: () => <B.PrimarySchool /> }),
  A({ id: 'clinic', name: 'CareFirst Clinic', category: 'Schools & civic', district: 'gardens', footprint: [18, 14], height: 7, description: 'Small health centre. Chapter 5’s survey data comes from here.', render: () => <B.Clinic /> }),
  A({ id: 'bus_stop', name: 'Bus stop shelter', category: 'Schools & civic', district: 'any', footprint: [5, 2.2], height: 2.9, description: 'Shelter with bench and route sign. Fast-travel points later.', render: () => <B.BusStop /> }),
  // Banks & companies
  A({ id: 'bank', name: 'Meridian Capital Bank', category: 'Banks & companies', district: 'finance', footprint: [26, 18], height: 9.8, description: 'Branch with a columned portico, ATM gallery and security post. Chapter 2 starts here.', render: () => <B.BankBranch /> }),
  A({ id: 'bank_modular', name: 'Meridian Capital (modular block)', category: 'Banks & companies', district: 'market', footprint: [16, 12], height: 13, description: 'Four-storey branch assembled from Downtown City MegaKit modules: metal shopfront, trimmed brick windows, corner columns, cornice and roof. Stands on Market Boulevard.', source: 'Quaternius · Downtown City MegaKit (assembled by Data City)', licence: 'CC0-1.0', render: () => <ModularBuilding spec={MERIDIAN_BLOCK} /> }),
  A({ id: 'tower_meridian', name: 'Meridian Tower', category: 'Banks & companies', district: 'finance', footprint: [26, 26], height: 90, description: 'The bank’s 22-floor headquarters with a rotating gold halo. The tallest thing on the skyline.', render: () => <B.OfficeTower company="meridianHQ" /> }),
  A({ id: 'tower_vantage', name: 'Vantage Insurance', category: 'Banks & companies', district: 'finance', footprint: [26, 26], height: 52, description: 'Louvred white office tower. Insurance claims data for a later chapter.', render: () => <B.OfficeTower company="vantage" /> }),
  A({ id: 'tower_lumen', name: 'Lumen Telecom', category: 'Banks & companies', district: 'tech', footprint: [26, 26], height: 77, description: 'Dark glass tower with a lattice mast. Network outage logs.', render: () => <B.OfficeTower company="lumen" /> }),
  A({ id: 'tower_kora', name: 'Kora Logistics', category: 'Banks & companies', district: 'tech', footprint: [26, 26], height: 51, description: 'Banded orange HQ with a fin crown. Delivery route data.', render: () => <B.OfficeTower company="kora" /> }),
  A({ id: 'tower_okeke', name: 'Okeke Foods', category: 'Banks & companies', district: 'market', footprint: [26, 26], height: 35, description: 'Mid-rise food company office near the market. Supplier pricing data.', render: () => <B.OfficeTower company="okeke" /> }),
  A({ id: 'techhub', name: 'Datacore Tech Hub', category: 'Banks & companies', district: 'tech', footprint: [30, 22], height: 8.5, description: 'Fenced data centre with rooftop cooling units and a cyan light strip.', render: () => <B.TechHub /> }),
  // Vehicles
  A({ id: 'minibus', name: 'Yellow minibus', category: 'Vehicles', district: 'any', footprint: [2, 6], height: 2.6, description: 'Yellow commuter bus with black stripes and an open side door. The signature vehicle of the city.', render: () => <V.Minibus /> }),
  A({ id: 'tricycle', name: 'Tricycle taxi (keke)', category: 'Vehicles', district: 'any', footprint: [1.4, 2.4], height: 2.3, description: 'Three-wheeled canopy taxi. Weaves through Market Boulevard.', render: () => <V.Tricycle /> }),
  A({ id: 'motorcycle', name: 'Motorcycle', category: 'Vehicles', district: 'any', footprint: [0.8, 2], height: 1.3, description: 'Commuter bike used for bike taxis.', render: () => <V.Motorcycle /> }),
  A({ id: 'car_sedan', name: 'Sedan', category: 'Vehicles', district: 'any', footprint: [1.8, 4.5], height: 1.6, description: 'Everyday saloon car. Pick colours from the vehicle palette.', render: () => <V.Car body="sedan" color={PALETTE.vehicles[4]} /> }),
  A({ id: 'car_taxi', name: 'City taxi', category: 'Vehicles', district: 'any', footprint: [1.8, 4.4], height: 1.8, description: 'Yellow taxi with a black side stripe and roof sign.', render: () => <V.Car body="taxi" /> }),
  A({ id: 'car_suv', name: 'SUV', category: 'Vehicles', district: 'finance', footprint: [2, 4.7], height: 2.1, description: 'Executive SUV, common outside the bank and towers.', render: () => <V.Car body="suv" color={PALETTE.vehicles[2]} /> }),
  A({ id: 'car_hatch', name: 'Hatchback', category: 'Vehicles', district: 'gardens', footprint: [1.8, 3.9], height: 1.6, description: 'Small city car parked in estates.', render: () => <V.Car body="hatchback" color={PALETTE.vehicles[0]} /> }),
  A({ id: 'pickup', name: 'Pickup truck', category: 'Vehicles', district: 'market', footprint: [1.9, 5.2], height: 2, description: 'Workhorse truck for market deliveries.', render: () => <V.Car body="pickup" color={PALETTE.vehicles[1]} /> }),
  A({ id: 'bus_brt', name: 'BRT city bus', category: 'Vehicles', district: 'any', footprint: [2.5, 11], height: 3.6, description: 'Blue rapid-transit bus on the main boulevard.', render: () => <V.CityBus /> }),
  A({ id: 'van_kora', name: 'Kora delivery van', category: 'Vehicles', district: 'tech', footprint: [2, 5.4], height: 2.6, description: 'Liveried delivery van. Swap the company and brand colour for Okeke Foods and others.', render: () => <V.DeliveryVan /> }),
  A({ id: 'van_okeke', name: 'Okeke Foods van', category: 'Vehicles', district: 'market', footprint: [2, 5.4], height: 2.6, description: 'Same van in Okeke Foods livery.', render: () => <V.DeliveryVan company="OKEKE FOODS" brand={PALETTE.brand.okeke} /> }),
  // Street props
  A({ id: 'water_tank', name: 'Water tank on stand', category: 'Street props', district: 'any', footprint: [1.3, 1.3], height: 2.6, description: 'Black plastic tank on a steel stand. Put one on almost every roof.', render: () => <WaterTank position={[0, 0, 0]} /> }),
  A({ id: 'generator', name: 'Generator', category: 'Street props', district: 'any', footprint: [1.6, 0.9], height: 1.6, description: 'Diesel generator. Pair with a looping hum in the audio pass.', render: () => <Generator position={[0, 0, 0]} /> }),
  A({ id: 'palm', name: 'Palm tree', category: 'Street props', district: 'any', footprint: [4, 4], height: 6.5, description: 'Lines the boulevards and the Academy plaza.', render: () => <PalmTree position={[0, 0, 0]} /> }),
  A({ id: 'shade_tree', name: 'Shade tree', category: 'Street props', district: 'gardens', footprint: [4, 4], height: 5, description: 'Broad tree for residential streets and school yards.', render: () => <ShadeTree position={[0, 0, 0]} /> }),
  A({ id: 'pole', name: 'Utility pole', category: 'Street props', district: 'any', footprint: [2, 0.4], height: 9, description: 'Wooden pole with transformer.', render: () => <UtilityPole position={[0, 0, 0]} /> }),
  A({ id: 'planter', name: 'Planter', category: 'Street props', district: 'any', footprint: [1.6, 0.7], height: 1.2, description: 'Concrete planter with shrubs and flowers.', render: () => <Planter position={[0, 0, 0]} /> }),
  A({ id: 'flag', name: 'Flagpole', category: 'Street props', district: 'academy', footprint: [2, 0.2], height: 8, description: 'Academy flag.', render: () => <FlagPole position={[0, 0, 0]} /> }),
  // Characters
  ...CHARACTERS.map((c) => A({
    id: c.id, name: c.name, category: 'Characters', district: districtFor(c.district), footprint: [0.6, 0.4], height: 1.75 * (c.outfit.height ?? 1),
    description: `${c.role}. ${c.story}`,
    render: () => <CastMember def={c} />,
    source: 'Quaternius · Universal Base Characters + Animation Library (outfits and headwear: Data City)', licence: 'CC0-1.0',
  })),
];

/** Every optimized third-party model, browsable raw in the Asset Lab under "Library". */
export const LIBRARY: KitAsset[] = Object.entries(KIT_INDEX.packs).flatMap(([packId, pack]) =>
  Object.keys(pack.models).map((name) => {
    const ref = `${packId}/${name}` as KitRef;
    const [w, h, d] = kitSize(ref);
    return A({
      id: `lib_${packId}_${name}`, name: `${name}`, category: 'Library', district: 'any', footprint: [round(w), round(d)], height: h,
      description: `Raw model from ${pack.author} — ${pack.name}. Scaled to metres for Data City.`,
      source: `${pack.author} · ${pack.name}`, licence: pack.licence,
      render: () => <KitModel kit={ref} />,
    });
  }),
);

function round(v: number) { return Math.round(v * 10) / 10; }

function districtFor(name: string): DistrictId | 'any' {
  const d = DISTRICTS.find((x) => x.name === name);
  return d ? d.id : 'any';
}

export const CATEGORIES: Category[] = ['Landmarks', 'Houses', 'Shops & market', 'Schools & civic', 'Banks & companies', 'Vehicles', 'Characters', 'Street props', 'Library'];
