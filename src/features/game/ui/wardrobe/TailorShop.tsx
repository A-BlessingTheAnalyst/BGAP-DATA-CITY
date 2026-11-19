'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Check, Scissors, ShoppingBag, Shirt, X } from 'lucide-react';
import { useGameState } from '../../engine/GameState';
import { AudioManager } from '../../audio/AudioManager';
import { naira } from '../phone/useCareer';
import { CadetPreview } from './CadetPreview';
import { buyItem, cadetDef, saveCadet, useWardrobe } from './useWardrobe';
import { wearItem } from '@/shared/wardrobe/look';
import type { OutfitItem, OutfitTag } from '@/shared/types/wardrobe';

type Filter = 'all' | Exclude<OutfitTag, 'starter'>;
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'casual', label: 'Casual' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'traditional', label: 'Traditional' },
];
const SLOT_LABEL: Record<OutfitItem['slot'], string> = { top: 'Top', bottom: 'Trousers', dress: 'Full length', shoes: 'Shoes', head: 'Headwear' };

/**
 * Zee Fabrics Tailoring: try anything on, buy it with money earned from clients (the server checks
 * the balance and charges once), then wear it. Opened at the tailor's counter on Market Boulevard.
 */
export function TailorShop() {
  const open = useGameState((s) => s.isShopOpen);
  const setOpen = useGameState((s) => s.setShopOpen);
  const balance = useGameState((s) => s.walletBalance);
  const profile = useWardrobe((s) => s.profile);
  const items = useWardrobe((s) => s.items);
  const byId = useWardrobe((s) => s.byId);
  const owned = useWardrobe((s) => s.owned);
  const [filter, setFilter] = useState<Filter>('all');
  const [trying, setTrying] = useState<OutfitItem | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    setTrying(null);
    setMessage(null);
    const key = (e: KeyboardEvent) => { if (e.code === 'Escape') { AudioManager.playUi('close'); setOpen(false); } };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [open, setOpen]);

  const forSale = useMemo(() => items.filter((i) => !i.tags.includes('starter') && (filter === 'all' || i.tags.includes(filter))), [items, filter]);
  const fallback = useMemo(() => ({
    top: profile?.equipped.top ?? items.find((i) => i.slot === 'top' && i.tags.includes('starter'))?.id ?? '',
    bottom: profile?.equipped.bottom ?? items.find((i) => i.slot === 'bottom' && i.tags.includes('starter'))?.id ?? '',
  }), [profile, items]);
  const preview = useMemo(() => {
    if (!profile) return null;
    const eq = trying ? wearItem(profile.equipped, trying, fallback) : profile.equipped;
    return cadetDef(profile.appearance, eq, byId, profile.name);
  }, [profile, trying, fallback, byId]);

  if (!open || !profile || !preview) return null;
  const ownedSet = new Set(owned);
  const wearing = new Set(Object.values(profile.equipped));

  const buy = async (it: OutfitItem) => {
    setBusy(it.id);
    setMessage(null);
    try {
      const { alreadyOwned } = await buyItem(it.id);
      AudioManager.playUi('confirm');
      setMessage({ ok: true, text: alreadyOwned ? `You already own ${it.name}.` : `Bought ${it.name} for ${naira(it.price)}.` });
    } catch (e) {
      AudioManager.playUi('error');
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Purchase failed.' });
    } finally {
      setBusy(null);
    }
  };
  const wear = async (it: OutfitItem) => {
    setBusy(it.id);
    setMessage(null);
    try {
      await saveCadet({ equipped: wearItem(profile.equipped, it, fallback) });
      AudioManager.playUi('select');
      setTrying(null);
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Could not change.' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div role="dialog" aria-label="Zee Fabrics Tailoring" className="fixed inset-0 z-50 bg-bgap-dark/95 backdrop-blur-sm flex flex-col md:flex-row pointer-events-auto select-none">
      {/* The fitting-room strip stays a dark, warm backdrop on purpose (contrast for the 3D
          render, same as the character creator's studio panel) even though the rest of this
          screen went light — so its own text is fixed light, not theme-token-based. */}
      <div className="md:w-[40%] h-[36vh] md:h-full relative bg-gradient-to-b from-[#3A1F1A] to-[#120C0B]">
        <CadetPreview def={preview} className="absolute inset-0" />
        <div className="absolute top-4 left-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-amber-300 flex items-center gap-1.5"><Scissors className="w-3.5 h-3.5" />Zee Fabrics Tailoring</div>
          <h1 className="text-2xl font-extrabold text-white">{trying ? `Trying on: ${trying.name}` : 'The mirror'}</h1>
        </div>
        {trying && (
          <button onClick={() => setTrying(null)} className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-black/50 text-xs text-white border border-white/20">Take it off</button>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 md:p-6 border-b border-bgap-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button key={f.id} onClick={() => setFilter(f.id)} aria-pressed={filter === f.id} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${filter === f.id ? 'bg-amber-400/15 border-amber-400 text-amber-300' : 'bg-bgap-card border-bgap-border text-bgap-muted hover:text-bgap-text'}`}>{f.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-bgap-gold text-sm tabular-nums">{balance === null ? '₦…' : naira(balance)}</span>
            <button onClick={() => { AudioManager.playUi('close'); setOpen(false); }} aria-label="Leave the shop" className="w-9 h-9 rounded-full bg-bgap-card text-bgap-muted hover:text-bgap-text flex items-center justify-center"><X className="w-4 h-4" /></button>
          </div>
        </div>
        {message && <p className={`mx-4 md:mx-6 mt-3 text-sm rounded-xl px-3 py-2 border ${message.ok ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' : 'text-red-300 bg-red-500/10 border-red-500/30'}`}>{message.text}</p>}
        <ul className="flex-1 overflow-y-auto p-4 md:p-6 grid gap-3 sm:grid-cols-2 content-start">
          {forSale.map((it) => {
            const has = ownedSet.has(it.id);
            const worn = wearing.has(it.id);
            const affordable = balance !== null && balance >= it.price;
            return (
              <li key={it.id} className={`rounded-xl border p-3 flex gap-3 ${trying?.id === it.id ? 'border-amber-400 bg-amber-400/5' : 'border-bgap-border bg-bgap-card'}`}>
                <button onClick={() => { setTrying(trying?.id === it.id ? null : it); AudioManager.playUi('select'); }} aria-label={`Try on ${it.name}`} className="shrink-0 w-14 h-14 rounded-lg border border-bgap-border relative overflow-hidden" style={{ background: it.color }}>
                  {it.accent && <span className="absolute inset-x-0 bottom-0 h-3" style={{ background: it.accent }} />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[13px] font-bold text-bgap-text leading-snug">{it.name}</div>
                    <span className="text-[10px] text-bgap-muted whitespace-nowrap">{SLOT_LABEL[it.slot]}</span>
                  </div>
                  <p className="text-[11px] text-bgap-muted leading-snug mb-2">{it.description}</p>
                  <div className="flex items-center gap-2">
                    {has ? (
                      worn ? (
                        <span className="text-[11px] text-emerald-300 inline-flex items-center gap-1"><Check className="w-3.5 h-3.5" />Wearing</span>
                      ) : (
                        <button onClick={() => wear(it)} disabled={busy === it.id} className="text-[11px] px-2.5 py-1 rounded-lg bg-bgap-cyan text-bgap-dark font-bold inline-flex items-center gap-1 disabled:opacity-50"><Shirt className="w-3.5 h-3.5" />Wear</button>
                      )
                    ) : (
                      <button onClick={() => buy(it)} disabled={busy === it.id || !affordable} title={affordable ? undefined : 'Not enough money yet'} className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-400 text-[#2B1A05] font-bold inline-flex items-center gap-1 disabled:opacity-40"><ShoppingBag className="w-3.5 h-3.5" />Buy {naira(it.price)}</button>
                    )}
                    {!has && !affordable && <span className="text-[10px] text-bgap-muted">Earn {naira(it.price - (balance ?? 0))} more</span>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
