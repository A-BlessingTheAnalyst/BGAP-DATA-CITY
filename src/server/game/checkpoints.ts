import { jsonFile } from '@/server/storage/jsonFile';
import { CITY_BOUNDS } from '@/features/game/world/kit/cityPlan';

// Where each player last stood. The user id always comes from the session, never the request body.
// Development store: .data/checkpoints.json (Supabase table to follow with real auth, roadmap T50).

export interface Checkpoint { userId: string; zoneId: string; coords: [number, number, number]; rotationY: number; savedAt: string }

const file = jsonFile<Checkpoint>('checkpoints.json');

/** Validates and clamps a position report from the client. Throws on nonsense. */
export function sanitiseCheckpoint(body: unknown): Omit<Checkpoint, 'userId' | 'savedAt'> {
  const b = (body ?? {}) as Record<string, unknown>;
  const zoneId = typeof b.zoneId === 'string' && /^[a-z0-9_-]{1,40}$/i.test(b.zoneId) ? b.zoneId : null;
  const c = Array.isArray(b.coords) ? b.coords.map(Number) : [];
  if (!zoneId) throw new Error('zoneId must be a short id.');
  if (c.length !== 3 || !c.every(Number.isFinite)) throw new Error('coords must be three numbers.');
  const B = CITY_BOUNDS;
  if (c[0] < B.minX || c[0] > B.maxX || c[2] < B.minZ || c[2] > B.maxZ || c[1] < -1 || c[1] > 200) throw new Error('coords are outside the city.');
  const rotationY = Number(b.rotationY ?? 0);
  return { zoneId, coords: [c[0], c[1], c[2]], rotationY: Number.isFinite(rotationY) ? rotationY : 0 };
}

export function saveCheckpoint(userId: string, cp: Omit<Checkpoint, 'userId' | 'savedAt'>) {
  return file.update((rows) => {
    const row: Checkpoint = { userId, ...cp, savedAt: new Date().toISOString() };
    return { rows: [...rows.filter((r) => r.userId !== userId), row], result: row };
  });
}

export const getCheckpoint = (userId: string): Checkpoint | null => file.read().find((r) => r.userId === userId) ?? null;
