import { jsonFile } from '@/server/storage/jsonFile';
import { vehicleCatalog } from '@/server/content/vehicles';
import { purchaseItem, purchasedItems } from '@/server/economy/wallet';
import { CITY_BOUNDS } from '@/features/game/world/kit/cityPlan';
import { MARKET_LAYOUT } from '@/shared/constants/marketLayout';
import { DRIVING_LICENCE_PRICE, FLIGHT_LICENCE_PRICE, type GarageView, type OwnedVehicle } from '@/shared/types/garage';

// A player's garage: which vehicles they own and where each one is parked. Ownership itself piggy-
// backs on the wallet ledger (same pattern as outfits: 'buy:<vehicleId>'); only *positions* need
// their own store, since a car moves around the city as you call or park it.

const file = jsonFile<{ userId: string; vehicles: OwnedVehicle[] }>('garage.json');

function readRow(userId: string) {
  return file.read().find((r) => r.userId === userId) ?? { userId, vehicles: [] };
}

async function writeRow(userId: string, vehicles: OwnedVehicle[]) {
  return file.update((rows) => ({ rows: [...rows.filter((r) => r.userId !== userId), { userId, vehicles }], result: vehicles }));
}

export async function ownedVehicleIds(userId: string): Promise<string[]> {
  return (await purchasedItems(userId)).filter((id) => vehicleCatalog().byId.has(id));
}

export async function hasDrivingLicence(userId: string): Promise<boolean> {
  return (await purchasedItems(userId)).includes('driving_licence');
}

export async function hasFlightLicence(userId: string): Promise<boolean> {
  return (await purchasedItems(userId)).includes('flight_licence');
}

export async function getGarageView(userId: string): Promise<GarageView> {
  const ids = await ownedVehicleIds(userId);
  const row = readRow(userId);
  const owned: OwnedVehicle[] = ids.map((vehicleId) => row.vehicles.find((v) => v.vehicleId === vehicleId) ?? { vehicleId, position: MARKET_LAYOUT.garage, rotationY: 0 });
  return { owned, hasLicence: await hasDrivingLicence(userId), hasFlightLicence: await hasFlightLicence(userId), garageSpot: MARKET_LAYOUT.garage };
}

/** Buys a car from the dealership (price from the catalog only) or the driving licence. */
export async function buyVehicleOrLicence(userId: string, itemId: string) {
  if (itemId === 'driving_licence') {
    const { created } = await purchaseItem({ userId, itemId, price: DRIVING_LICENCE_PRICE, name: 'Driving licence' });
    return { created, name: 'Driving licence' };
  }
  if (itemId === 'flight_licence') {
    const { created } = await purchaseItem({ userId, itemId, price: FLIGHT_LICENCE_PRICE, name: 'Flight licence' });
    return { created, name: 'Flight licence' };
  }
  const v = vehicleCatalog().byId.get(itemId);
  if (!v) throw new Error('That vehicle is not sold here.');
  const { created } = await purchaseItem({ userId, itemId: v.id, price: v.price, name: v.name });
  if (created) {
    const row = readRow(userId);
    const spawn = v.body === 'chopper' ? MARKET_LAYOUT.airfield : MARKET_LAYOUT.garage;
    await writeRow(userId, [...row.vehicles.filter((x) => x.vehicleId !== v.id), { vehicleId: v.id, position: spawn, rotationY: 0 }]);
  }
  return { created, name: v.name };
}

/** Calls an owned car to a position in the city (e.g. near the player). */
export async function callVehicle(userId: string, vehicleId: string, position: [number, number, number], rotationY: number) {
  const owned = await ownedVehicleIds(userId);
  if (!owned.includes(vehicleId)) throw new Error("You don't own that vehicle.");
  const B = CITY_BOUNDS;
  if (position[0] < B.minX || position[0] > B.maxX || position[2] < B.minZ || position[2] > B.maxZ) throw new Error('That spot is outside the city.');
  const row = readRow(userId);
  const vehicles = [...row.vehicles.filter((v) => v.vehicleId !== vehicleId), { vehicleId, position, rotationY }];
  await writeRow(userId, vehicles);
  return vehicles.find((v) => v.vehicleId === vehicleId)!;
}
