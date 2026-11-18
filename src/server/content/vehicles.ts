import fs from 'node:fs';
import path from 'node:path';
import type { VehicleBody, VehicleDef } from '@/shared/types/garage';

const FILE = path.join(process.cwd(), 'content', 'vehicles.json');
const BODIES: VehicleBody[] = ['hatchback', 'sedan', 'taxi', 'suv', 'pickup', 'keke', 'chopper'];

export function checkVehicles(items: VehicleDef[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const v of items) {
    const at = `vehicle "${v.id}"`;
    if (!v.id || ids.has(v.id)) errors.push(`${at}: missing or duplicate id`);
    ids.add(v.id);
    if (!BODIES.includes(v.body)) errors.push(`${at}: unknown body ${v.body}`);
    if (!/^#[0-9A-Fa-f]{6}$/.test(v.color ?? '')) errors.push(`${at}: color must be #RRGGBB`);
    if (!Number.isInteger(v.price) || v.price <= 0) errors.push(`${at}: price must be a positive whole number`);
    if (!(v.maxSpeed > 0 && v.maxSpeed < 60)) errors.push(`${at}: maxSpeed should be a sane arcade value (m/s)`);
    if (v.licence && v.licence !== 'driving' && v.licence !== 'flight') errors.push(`${at}: licence must be 'driving' or 'flight'`);
    if (v.body === 'chopper' && v.licence !== 'flight') errors.push(`${at}: a chopper needs licence: 'flight'`);
    if (!v.name || !v.description) errors.push(`${at}: needs a name and description`);
  }
  return errors;
}

let cache: { items: VehicleDef[]; byId: Map<string, VehicleDef> } | null = null;
export function vehicleCatalog() {
  if (cache && process.env.NODE_ENV === 'production') return cache;
  const items = (JSON.parse(fs.readFileSync(FILE, 'utf8')) as { vehicles: VehicleDef[] }).vehicles;
  const errors = checkVehicles(items);
  if (errors.length) throw new Error(`content/vehicles.json is invalid:\n${errors.join('\n')}`);
  cache = { items, byId: new Map(items.map((v) => [v.id, v])) };
  return cache;
}
