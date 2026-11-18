// Phase D acceptance tests: the dealership, the driving licence gate, calling a car, and fares.
// Run: npm run test:garage
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_CITY_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'datacity-garage-'));

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? '  ✓' : '  ✗'} ${label}`);
  if (!ok) failures++;
};
const throws = async (fn: () => unknown) => { try { await fn(); return false; } catch { return true; } };

async function main() {
  const { checkVehicles, vehicleCatalog } = await import('../src/server/content/vehicles');
  const G = await import('../src/server/game/garage');
  const W = await import('../src/server/economy/wallet');
  const { fareFor } = await import('../src/server/economy/fares');
  const { DRIVING_LICENCE_PRICE, FLIGHT_LICENCE_PRICE } = await import('../src/shared/types/garage');
  const { MARKET_LAYOUT } = await import('../src/shared/constants/marketLayout');

  console.log('Vehicle catalog');
  const { items, byId } = vehicleCatalog();
  check(checkVehicles(items).length === 0, `content/vehicles.json is valid (${items.length} vehicles)`);
  check(checkVehicles([{ ...items[0], price: -5 }]).length > 0, 'a negative price is caught');
  check(byId.has('hatch_used') && byId.has('keke_napep'), 'the catalog has an affordable starter car and a keke');

  console.log('Fares');
  check(fareFor(0) === 300, 'a zero-distance fare is just the base fare');
  check(fareFor(1000) > fareFor(100), 'a longer ride costs more');
  check(fareFor(100) === 350, '100 m costs the base fare plus one 100 m increment, rounded to the nearest ₦50');

  console.log('Buying and the licence gate');
  const u = 'driver';
  check((await G.getGarageView(u)).hasLicence === false, 'new players have no licence');
  check((await G.getGarageView(u)).owned.length === 0, 'new players own no cars');
  await W.creditMissionReward({ userId: u, missionId: 'test-job', amount: 10_000_000, xp: 0, reason: 'test windfall' });
  const car = items.find((v) => v.price < 5_000_000)!;
  const bought = await G.buyVehicleOrLicence(u, car.id);
  check(bought.created, 'buying an affordable car succeeds');
  check((await G.getGarageView(u)).owned.some((o) => o.vehicleId === car.id), 'the bought car shows up in the garage');
  const again = await G.buyVehicleOrLicence(u, car.id);
  check(!again.created, 'buying the same car again charges nothing');
  const licence = await G.buyVehicleOrLicence(u, 'driving_licence');
  check(licence.created, 'buying the driving licence succeeds');
  check((await G.getGarageView(u)).hasLicence, 'the licence now shows as owned');
  check(await throws(() => G.buyVehicleOrLicence(u, 'not_a_real_vehicle')), 'buying a vehicle not in the catalog is refused');

  console.log('Insufficient funds');
  const poor = 'poor-driver';
  let insufficient: unknown = null;
  try { await G.buyVehicleOrLicence(poor, 'suv_executive'); } catch (e) { insufficient = e; }
  check(insufficient instanceof W.InsufficientFunds, 'a car you cannot afford is refused');
  check((await G.getGarageView(poor)).owned.length === 0, 'a refused purchase grants nothing');

  console.log('Calling a car');
  const moved = await G.callVehicle(u, car.id, [10, 0.9, 10], 1.2);
  check(moved.position[0] === 10 && moved.position[2] === 10, 'calling an owned car moves it');
  check(await throws(() => G.callVehicle(u, 'not_owned', [0, 0, 0], 0)), "calling a car you don't own is refused");
  check(await throws(() => G.callVehicle(u, car.id, [99999, 0, 0], 0)), 'calling a car outside the city is refused');

  console.log('Driving licence price matches the catalog type');
  check(DRIVING_LICENCE_PRICE === 200_000, 'the licence costs ₦200,000 (docs/game-design.md §4)');

  console.log('Phase F: the chopper and the flight licence');
  const chopper = items.find((v) => v.body === 'chopper')!;
  check(!!chopper && chopper.licence === 'flight', 'the catalog has exactly one chopper, gated by the flight licence');
  check(checkVehicles([{ ...chopper, licence: 'driving' }]).length > 0, 'a chopper without licence: "flight" is caught');
  const flier = 'aviator';
  check((await G.getGarageView(flier)).hasFlightLicence === false, 'new players have no flight licence');
  await W.creditMissionReward({ userId: flier, missionId: 'test-job', amount: 600_000_000, xp: 0, reason: 'test windfall' });
  const boughtChopper = await G.buyVehicleOrLicence(flier, chopper.id);
  check(boughtChopper.created, 'buying the chopper succeeds with enough money');
  check((await G.getGarageView(flier)).owned.find((o) => o.vehicleId === chopper.id)?.position[0] === MARKET_LAYOUT.airfield[0], 'a new chopper is parked at the Airfield, not the car garage spot');
  const flightLicence = await G.buyVehicleOrLicence(flier, 'flight_licence');
  check(flightLicence.created, 'buying the flight licence succeeds');
  check((await G.getGarageView(flier)).hasFlightLicence, 'the flight licence now shows as owned');
  check((FLIGHT_LICENCE_PRICE as number) === 15_000_000, 'flight school costs ₦15,000,000 (docs/game-design.md §4), separately from the driving licence');

  console.log(failures ? `\n${failures} check(s) failed` : '\nAll garage checks passed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
