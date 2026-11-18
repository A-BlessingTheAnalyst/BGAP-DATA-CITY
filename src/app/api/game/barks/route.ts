import { NextResponse } from 'next/server';
import { barks } from '@/server/content/barks';

export const dynamic = 'force-dynamic';

/** Every bark line (public: flavour text, no secrets). */
export async function GET() {
  try {
    return NextResponse.json({ barks: barks() });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Barks unavailable' }, { status: 500 });
  }
}
