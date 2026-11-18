'use client';
import { create } from 'zustand';
import { useGameState } from '../../engine/GameState';
import type { GarageView, VehicleDef } from '@/shared/types/garage';

// Client mirror of the player's garage. The server decides: ownership and the licence come from
// the wallet ledger, car positions are validated server-side when called.

interface GarageStore extends GarageView {
  loaded: boolean;
  catalog: VehicleDef[];
  licencePrice: number;
  flightLicencePrice: number;
}

export const useGarage = create<GarageStore>(() => ({ loaded: false, owned: [], hasLicence: false, hasFlightLicence: false, garageSpot: [0, 0, 0], catalog: [], licencePrice: 200_000, flightLicencePrice: 15_000_000 }));

const json = async (r: Response) => {
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data?.error ?? r.statusText), { status: r.status, data });
  return data;
};

let loading: Promise<void> | null = null;
export function loadGarage(force = false) {
  if (loading && !force) return loading;
  loading = fetch('/api/game/garage').then(json).then((v: GarageView & { catalog: VehicleDef[]; licencePrice: number; flightLicencePrice: number }) => {
    useGarage.setState({ loaded: true, ...v });
  }).catch(() => { loading = null; });
  return loading;
}

export async function buyFromDealership(itemId: string): Promise<{ created: boolean; name: string }> {
  const res = await fetch('/api/game/garage/buy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId }) }).then(json);
  useGarage.setState({ owned: res.owned, hasLicence: res.hasLicence, hasFlightLicence: res.hasFlightLicence, garageSpot: res.garageSpot });
  useGameState.getState().setWalletBalance(res.balance);
  return { created: res.created, name: res.name };
}

export async function callCar(vehicleId: string, position: [number, number, number], rotationY: number) {
  const res: { vehicle: GarageView['owned'][number] } = await fetch('/api/game/garage/call', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vehicleId, position, rotationY }) }).then(json);
  useGarage.setState((s) => ({ owned: s.owned.map((v) => (v.vehicleId === vehicleId ? res.vehicle : v)) }));
  return res.vehicle;
}

/** Hails a ride: pays the fare for the road distance between two points and returns it, or throws (402 = can't afford it). */
export async function hailRide(from: [number, number], to: [number, number]): Promise<{ fare: number; metres: number }> {
  const res = await fetch('/api/game/garage/hail', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to }) }).then(json);
  useGameState.getState().setWalletBalance(res.balance);
  return { fare: res.fare, metres: res.metres };
}
