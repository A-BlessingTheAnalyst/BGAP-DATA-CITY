// Phase B acceptance tests: catalog, buying, ownership and the saved cadet.  Run: npm run test:shop
// Uses a temporary data folder, so it never touches your dev wallet.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.DATA_CITY_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'datacity-shop-'));

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`${ok ? '  ✓' : '  ✗'} ${label}`);
  if (!ok) failures++;
};
const throws = async (fn: () => unknown) => { try { await fn(); return false; } catch { return true; } };

async function main() {
  const { catalog, checkCatalog, starterIds } = await import('../src/server/content/outfits');
  const W = await import('../src/server/economy/wallet');
  const P = await import('../src/server/game/profiles');
  const { resolveLook, PRESET_CADETS, DEFAULT_APPEARANCE, DEFAULT_EQUIPPED } = await import('../src/shared/wardrobe/look');

  console.log('Catalog');
  const { items, byId } = catalog();
  check(checkCatalog(items).length === 0, `content/outfits.json is valid (${items.length} items)`);
  check(checkCatalog([...items, { ...items[0] }]).some((e) => e.includes('duplicate')), 'duplicate ids are caught');
  check(checkCatalog([{ ...items[0], price: 5 }]).length > 0, 'a priced starter item is caught');
  check(PRESET_CADETS.every((p) => Object.values(p.equipped).every((id) => byId.get(id as string)?.tags.includes('starter'))), 'every quick-pick cadet wears only starter items');

  console.log('Buying');
  const u = 'shopper';
  const start = (await W.getWallet(u)).balance; // ₦5,000 welcome grant
  check(start === 5000, 'new players start with the ₦5,000 welcome grant');
  await W.creditMissionReward({ userId: u, missionId: 'test-job', amount: 20000, xp: 0, reason: 'test' });
  const funded = (await W.getWallet(u)).balance;
  const cap = byId.get('cap_teal')!;
  const first = await W.purchaseItem({ userId: u, itemId: cap.id, price: cap.price, name: cap.name });
  check(first.created && (await W.getWallet(u)).balance === funded - cap.price, `buying the cap debits ₦${cap.price} once`);
  const again = await W.purchaseItem({ userId: u, itemId: cap.id, price: cap.price, name: cap.name });
  check(!again.created && (await W.getWallet(u)).balance === funded - cap.price, 'buying it again charges nothing');
  const suit = byId.get('suit_navy')!;
  let insufficient: unknown = null;
  try { await W.purchaseItem({ userId: u, itemId: suit.id, price: suit.price, name: suit.name }); } catch (e) { insufficient = e; }
  check(insufficient instanceof W.InsufficientFunds, 'a suit you cannot afford is refused');
  check((await W.getWallet(u)).balance === funded - cap.price, 'a refused purchase leaves the balance alone');
  // Two clicks at once still debit once.
  const linen = byId.get('linen_shirt_sand')!;
  const before = (await W.getWallet(u)).balance;
  await Promise.all([1, 2, 3].map(() => W.purchaseItem({ userId: u, itemId: linen.id, price: linen.price, name: linen.name })));
  check((await W.getWallet(u)).balance === before - linen.price, 'three simultaneous buys of one shirt charge once');
  const owned = await P.ownedItems(u);
  check(owned.includes('cap_teal') && owned.includes('linen_shirt_sand') && starterIds().every((id) => owned.includes(id)), 'owned = starter items + purchases');

  console.log('Cadet profile');
  check((await P.getProfileView('nobody')).profile === null, 'no profile before the character creator');
  check(await throws(() => P.saveProfile(u, { name: 'Ada' })), 'creating a cadet needs name, appearance and outfit');
  check(await throws(() => P.saveProfile(u, { name: 'A', appearance: DEFAULT_APPEARANCE, equipped: DEFAULT_EQUIPPED })), 'one-letter names are refused');
  check(await throws(() => P.saveProfile(u, { name: 'Ada', appearance: { ...DEFAULT_APPEARANCE, body: 'male', hair: 'Hair_Buns' }, equipped: DEFAULT_EQUIPPED })), 'a hairstyle from the other body is refused');
  check(await throws(() => P.saveProfile(u, { name: 'Ada', appearance: DEFAULT_APPEARANCE, equipped: { ...DEFAULT_EQUIPPED, top: 'suit_navy' } })), 'equipping a suit you do not own is refused');
  check(await throws(() => P.saveProfile(u, { name: 'Ada', appearance: DEFAULT_APPEARANCE, equipped: { ...DEFAULT_EQUIPPED, top: 'starter_trousers_navy' } })), 'trousers in the top slot are refused');
  const saved = await P.saveProfile(u, { name: '  Ada   Obi ', appearance: DEFAULT_APPEARANCE, equipped: { ...DEFAULT_EQUIPPED, head: 'cap_teal', top: 'linen_shirt_sand' } });
  check(saved.name === 'Ada Obi' && saved.equipped.head === 'cap_teal', 'a valid cadet saves (name tidied, bought items equipped)');
  const reloaded = (await P.getProfileView(u)).profile;
  check(reloaded?.equipped.top === 'linen_shirt_sand' && reloaded?.appearance.skin === DEFAULT_APPEARANCE.skin, 'the look persists after a reload');
  const renamed = await P.saveProfile(u, { name: 'Ada' });
  check(renamed.equipped.top === 'linen_shirt_sand', 'a partial update keeps the rest');

  console.log('Rendering a look');
  const dressed = resolveLook(DEFAULT_APPEARANCE, { dress: 'boubou_ankara', shoes: 'starter_sneakers_black', head: 'gele_yellow' }, byId);
  check(dressed.outfit.garment === 'boubou' && dressed.outfit.top === dressed.outfit.bottom, 'a boubou dresses top and bottom in one fabric');
  check(dressed.look.hair === 'none' && dressed.outfit.head === 'gele', 'a gele replaces the hair');
  const suited = resolveLook(DEFAULT_APPEARANCE, { top: 'suit_charcoal', bottom: 'suit_trousers_charcoal', shoes: 'oxfords_black' }, byId);
  check(suited.outfit.garment === 'suit' && !!suited.outfit.accessories?.includes('tie'), 'a suit jacket comes with its tie');

  console.log(failures ? `\n${failures} check(s) failed` : '\nAll shop checks passed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
