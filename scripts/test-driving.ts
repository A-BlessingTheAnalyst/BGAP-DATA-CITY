// Checks the shared vehicle dynamics (src/features/game/world/vehicleDynamics.ts) feel like driving:
// sensible 0→60 km/h, a real top speed without holding boost, brakes stronger than coasting,
// a believable turning circle, limited reverse, and collisions judged by swept length.
import { PROFILES, profileFor, stepVehicle, type VehicleState, type DriveInput } from '../src/features/game/world/vehicleDynamics';

let failures = 0;
const check = (name: string, ok: boolean, detail: string) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} — ${detail}`);
  if (!ok) failures++;
};
const DT = 1 / 60;
const run = (s: VehicleState, p: typeof PROFILES.sedan, input: DriveInput, seconds: number, until?: (s: VehicleState) => boolean) => {
  let t = 0, x = 0, z = 0;
  for (; t < seconds; t += DT) {
    const r = stepVehicle(s, p, input, DT);
    x += r.dx; z += r.dz;
    if (until?.(s)) break;
  }
  return { t, x, z };
};
const kmh = (v: number) => v * 3.6;

const sedan = PROFILES.sedan;
{
  const s = { speed: 0, yaw: 0, steer: 0 };
  const { t } = run(s, sedan, { throttle: 1, steer: 0 }, 20, (st) => kmh(st.speed) >= 60);
  check('sedan 0→60 km/h', t > 2.5 && t < 7, `${t.toFixed(2)} s`);
}
{
  const s = { speed: 0, yaw: 0, steer: 0 };
  run(s, sedan, { throttle: 1, steer: 0 }, 40);
  check('sedan top speed without boost', kmh(s.speed) > 75 && kmh(s.speed) <= 92, `${kmh(s.speed).toFixed(1)} km/h`);
  const boosted = { speed: s.speed, yaw: 0, steer: 0 };
  run(boosted, sedan, { throttle: 1, steer: 0, boost: true }, 40);
  check('boost raises top speed', boosted.speed > s.speed * 1.1, `${kmh(boosted.speed).toFixed(1)} km/h`);
}
{
  const brake = { speed: 50 / 3.6, yaw: 0, steer: 0 };
  const b = run(brake, sedan, { throttle: -1, steer: 0 }, 10, (st) => st.speed <= 0);
  const coast = { speed: 50 / 3.6, yaw: 0, steer: 0 };
  const c = run(coast, sedan, { throttle: 0, steer: 0 }, 30, (st) => st.speed <= 0);
  check('braking from 50 km/h', Math.hypot(b.x, b.z) < 14, `${Math.hypot(b.x, b.z).toFixed(1)} m (coasting takes ${Math.hypot(c.x, c.z).toFixed(0)} m)`);
  check('coasting eventually stops, never reverses', coast.speed === 0, `speed ${coast.speed}`);
}
{
  const s = { speed: 0, yaw: 0, steer: 0 };
  run(s, sedan, { throttle: -1, steer: 0 }, 20);
  check('reverse is limited', s.speed < 0 && kmh(-s.speed) < 25, `${kmh(s.speed).toFixed(1)} km/h`);
}
{
  // Turning circle at ~20 km/h, full lock: should be a few car-lengths, not a spin on the spot.
  const s = { speed: 20 / 3.6, yaw: 0, steer: 0 };
  const steady = { throttle: 0.25, steer: 1 };
  run(s, sedan, steady, 2);
  const yaw0 = s.yaw;
  const start = run(s, sedan, steady, 1);
  const radius = Math.abs(s.speed / ((s.yaw - yaw0) / 1));
  check('turning radius at 20 km/h', radius > 4 && radius < 12, `${radius.toFixed(1)} m (moved ${Math.hypot(start.x, start.z).toFixed(1)} m)`);
  // At 80 km/h the same input gives a much wider arc (speed-sensitive steering).
  const fast = { speed: 80 / 3.6, yaw: 0, steer: 0 };
  run(fast, sedan, { throttle: 0.6, steer: 1 }, 2);
  const y1 = fast.yaw;
  run(fast, sedan, { throttle: 0.6, steer: 1 }, 1);
  const r2 = Math.abs(fast.speed / (fast.yaw - y1));
  check('steering is speed-sensitive', r2 > radius * 3, `${r2.toFixed(1)} m at 80 km/h`);
  // Not steerable while parked.
  const parked = { speed: 0, yaw: 0, steer: 0 };
  run(parked, sedan, { throttle: 0, steer: 1 }, 1);
  check('no yaw while stationary', parked.yaw === 0, `yaw ${parked.yaw}`);
}
{
  // Regression: driving almost exactly along +x, the minor-axis move is tiny; a sweep that loses a
  // rounding hair on z must NOT be read as a crash (the old per-axis test cut speed by 70%).
  const s = { speed: 15, yaw: Math.PI / 2 + 0.001, steer: 0 };
  const r = stepVehicle(s, sedan, { throttle: 1, steer: 0 }, DT, (dx, dz) => ({ x: dx, z: dz * 0.2 }));
  check('rounding on minor axis is not a crash', !r.hit && s.speed > 14.9, `hit=${r.hit} speed=${s.speed.toFixed(2)}`);
  const wall = { speed: 15, yaw: 0, steer: 0 };
  const w = stepVehicle(wall, sedan, { throttle: 1, steer: 0 }, DT, () => ({ x: 0, z: 0 }));
  check('head-on wall stops the car', w.hit && wall.speed <= 0, `speed=${wall.speed.toFixed(2)}`);
}
{
  const keke = profileFor('keke');
  const s = { speed: 0, yaw: 0, steer: 0 };
  run(s, keke, { throttle: 1, steer: 0 }, 40);
  check('keke is slower than a sedan', kmh(s.speed) < 50 && kmh(s.speed) > 35, `${kmh(s.speed).toFixed(1)} km/h`);
  const catalog = profileFor('sedan', 25);
  check('catalog top speed applies', catalog.topSpeed === 25, `${catalog.topSpeed}`);
}

if (failures) { console.error(`\n${failures} driving check(s) failed`); process.exit(1); }
console.log('\nAll driving checks passed');
