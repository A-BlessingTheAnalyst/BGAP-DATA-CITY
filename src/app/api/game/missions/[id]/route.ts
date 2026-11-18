import { NextResponse } from 'next/server';
import { getMission, toPublicDetail } from '@/server/content/missions';

export const dynamic = 'force-dynamic';

/** One mission with its visible dataset, for the analytics terminal. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const pkg = getMission(params.id);
  if (!pkg) return NextResponse.json({ error: 'Mission not found.' }, { status: 404 });
  return NextResponse.json(toPublicDetail(pkg));
}
