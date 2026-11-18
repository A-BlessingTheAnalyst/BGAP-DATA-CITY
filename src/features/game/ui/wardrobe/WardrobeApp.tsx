'use client';
import React, { useMemo, useState } from 'react';
import { UserRound } from 'lucide-react';
import { useGameState } from '../../engine/GameState';
import { AudioManager } from '../../audio/AudioManager';
import { CadetPreview } from './CadetPreview';
import { saveCadet, usePlayerDef, useWardrobe } from './useWardrobe';
import { wearItem } from '@/shared/wardrobe/look';
import type { OutfitItem, Slot } from '@/shared/types/wardrobe';

const ORDER: { slot: Slot; label: string }[] = [
  { slot: 'top', label: 'Tops' },
  { slot: 'dress', label: 'Full length' },
  { slot: 'bottom', label: 'Bottoms' },
  { slot: 'shoes', label: 'Shoes' },
  { slot: 'head', label: 'Headwear' },
];

/** DataPhone app: change into anything you own. Buying happens at Zee Fabrics Tailoring. */
export function WardrobeApp() {
  const profile = useWardrobe((s) => s.profile);
  const items = useWardrobe((s) => s.items);
  const owned = useWardrobe((s) => s.owned);
  const setCreatorOpen = useGameState((s) => s.setCreatorOpen);
  const def = usePlayerDef();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mine = useMemo(() => {
    const set = new Set(owned);
    return items.filter((i) => set.has(i.id));
  }, [items, owned]);

  if (!profile) return <p className="text-xs text-bgap-muted">Create your cadet first.</p>;
  const worn = new Set(Object.values(profile.equipped));
  const fallback = { top: profile.equipped.top ?? mine.find((i) => i.slot === 'top')!.id, bottom: profile.equipped.bottom ?? mine.find((i) => i.slot === 'bottom')!.id };

  const wear = async (it: OutfitItem) => {
    if (busy || (worn.has(it.id) && it.slot !== 'head')) return;
    setBusy(true);
    setError(null);
    try {
      await saveCadet({ equipped: wearItem(profile.equipped, it, fallback) });
      AudioManager.playUi('select');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not change.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <CadetPreview def={def} className="w-28 h-36 rounded-xl bg-gradient-to-b from-[#16233A] to-[#0B111D] overflow-hidden shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-bold text-bgap-text truncate">{profile.name}</div>
          <div className="text-[11px] text-bgap-muted mb-2">{mine.length} items owned</div>
          <button onClick={() => setCreatorOpen(true)} className="text-[11px] px-2.5 py-1 rounded-lg border border-bgap-border text-bgap-muted hover:text-bgap-text inline-flex items-center gap-1"><UserRound className="w-3.5 h-3.5" />Edit cadet</button>
        </div>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      {ORDER.map(({ slot, label }) => {
        const list = mine.filter((i) => i.slot === slot);
        if (!list.length) return null;
        return (
          <section key={slot}>
            <h3 className="text-[10px] font-mono uppercase tracking-wider text-bgap-muted mb-1.5">{label}</h3>
            <div className="flex flex-wrap gap-2">
              {list.map((it) => (
                <button
                  key={it.id}
                  onClick={() => wear(it)}
                  disabled={busy}
                  title={it.name}
                  aria-label={`${worn.has(it.id) ? 'Wearing' : 'Wear'} ${it.name}`}
                  aria-pressed={worn.has(it.id)}
                  className={`w-10 h-10 rounded-lg border-2 relative overflow-hidden ${worn.has(it.id) ? 'border-bgap-cyan' : 'border-bgap-border hover:border-bgap-muted'}`}
                  style={{ background: it.color }}
                >
                  {it.accent && <span className="absolute inset-x-0 bottom-0 h-2" style={{ background: it.accent }} />}
                </button>
              ))}
            </div>
          </section>
        );
      })}
      <p className="text-[11px] text-bgap-muted">New clothes are sold at Zee Fabrics Tailoring on Market Boulevard.</p>
    </div>
  );
}
