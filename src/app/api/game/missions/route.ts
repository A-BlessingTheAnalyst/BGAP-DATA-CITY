import { NextResponse } from 'next/server';
import { listMissions, toPublic } from '@/server/content/missions';

export const dynamic = 'force-dynamic';

/** Job board: every story case and today's generated gigs, without answers or hidden data. */
export async function GET() {
  return NextResponse.json({ missions: listMissions().map((m) => toPublic(m.def)) });
}
