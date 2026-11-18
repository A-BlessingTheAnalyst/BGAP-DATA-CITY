// Phase D: owned vehicles and getting around. Prices follow docs/game-design.md §4.
export type VehicleBody = 'hatchback' | 'sedan' | 'taxi' | 'suv' | 'pickup' | 'keke';

export interface VehicleDef {
  id: string;
  name: string;
  body: VehicleBody;
  color: string;
  price: number;
  maxSpeed: number; // m/s, arcade-tuned
  description: string;
}

/** A car the player owns, with where it is parked (moves when you "call" it or park it). */
export interface OwnedVehicle {
  vehicleId: string;
  position: [number, number, number];
  rotationY: number;
}

export interface GarageView {
  owned: OwnedVehicle[];
  hasLicence: boolean;
  /** The vehicle currently parked near the player's Academy Quarter garage spot, if none is called out. */
  garageSpot: [number, number, number];
}

export const DRIVING_LICENCE_PRICE = 200_000;
