import fs from 'node:fs';
import path from 'node:path';
import type { BarkDef, BarkSituation } from '@/shared/types/barks';

const FILE = path.join(process.cwd(), 'content', 'barks.json');
const SITUATIONS: BarkSituation[] = ['horn', 'shout', 'push', 'thanks', 'bumped', 'greeting'];

export function checkBarks(barks: BarkDef[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const b of barks) {
    const at = `bark "${b.id}"`;
    if (!b.id || ids.has(b.id)) errors.push(`${at}: missing or duplicate id`);
    ids.add(b.id);
    if (!SITUATIONS.includes(b.situation)) errors.push(`${at}: unknown situation ${b.situation}`);
    if (b.speaker !== 'driver' && b.speaker !== 'pedestrian') errors.push(`${at}: unknown speaker ${b.speaker}`);
    if (!b.text_en || !b.text_pcm) errors.push(`${at}: needs text_en and text_pcm`);
  }
  for (const s of SITUATIONS) if (!barks.some((b) => b.situation === s)) errors.push(`barks: no line for situation "${s}"`);
  return errors;
}

let cache: BarkDef[] | null = null;
export function barks(): BarkDef[] {
  if (cache && process.env.NODE_ENV === 'production') return cache;
  const data = (JSON.parse(fs.readFileSync(FILE, 'utf8')) as { barks: BarkDef[] }).barks;
  const errors = checkBarks(data);
  if (errors.length) throw new Error(`content/barks.json is invalid:\n${errors.join('\n')}`);
  cache = data;
  return cache;
}

export const barksFor = (situation: BarkSituation) => barks().filter((b) => b.situation === situation);
