import { NextResponse } from 'next/server';
import { catalog } from '@/server/content/outfits';

export const dynamic = 'force-dynamic';

/** Every outfit item with its price (public: the catalog has no secrets). */
export async function GET() {
  try {
    return NextResponse.json({ items: catalog().items });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Catalog unavailable' }, { status: 500 });
  }
}
