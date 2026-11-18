import { NextResponse } from 'next/server';
import { SessionValidator } from '@/server/game/SessionValidator';
import { catalog } from '@/server/content/outfits';
import { getWallet, InsufficientFunds, purchaseItem } from '@/server/economy/wallet';
import { ownedItems } from '@/server/game/profiles';

export const dynamic = 'force-dynamic';

/**
 * Buys an outfit item: { itemId }. The price comes from the catalog (never the client), the
 * balance is checked and debited in one step, and each item is charged at most once.
 */
export async function POST(request: Request) {
  let session;
  try {
    session = await SessionValidator.validateSession(request.headers.get('authorization'));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unauthorized' }, { status: 401 });
  }
  try {
    const { itemId } = await request.json();
    const item = catalog().byId.get(String(itemId ?? ''));
    if (!item) return NextResponse.json({ error: 'That item is not sold here.' }, { status: 404 });
    let alreadyOwned = item.tags.includes('starter');
    if (!alreadyOwned) {
      const { created } = await purchaseItem({ userId: session.userId, itemId: item.id, price: item.price, name: item.name });
      alreadyOwned = !created;
    }
    const wallet = await getWallet(session.userId);
    return NextResponse.json({ itemId: item.id, alreadyOwned, balance: wallet.balance, owned: await ownedItems(session.userId) });
  } catch (err) {
    if (err instanceof InsufficientFunds) return NextResponse.json({ error: err.message, balance: err.balance }, { status: 402 });
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Purchase failed.' }, { status: 400 });
  }
}
