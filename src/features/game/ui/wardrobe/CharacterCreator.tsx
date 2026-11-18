'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, Shuffle, X } from 'lucide-react';
import { useGameState } from '../../engine/GameState';
import { AudioManager } from '../../audio/AudioManager';
import { PALETTE } from '../../world/kit/palette';
import { CadetPreview } from './CadetPreview';
import { cadetDef, saveCadet, useWardrobe } from './useWardrobe';
import { DEFAULT_APPEARANCE, DEFAULT_EQUIPPED, PRESET_CADETS } from '@/shared/wardrobe/look';
import { HAIR_COLORS, HAIR_STYLES, type Appearance, type BodyType, type Equipped, type HairStyle, type Slot } from '@/shared/types/wardrobe';

const HAIR_LABEL: Record<HairStyle, string> = {
  Hair_Buns: 'Buns', Hair_Long: 'Long', Hair_BuzzedFemale: 'Cropped', Hair_Buzzed: 'Buzz cut', Hair_SimpleParted: 'Side part', Hair_Beard: 'Beard', none: 'Bald',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] font-mono uppercase tracking-wider text-bgap-muted">{title}</h3>
      {children}
    </section>
  );
}

function Swatch({ color, active, onClick, label }: { color: string; active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`w-9 h-9 rounded-full border-2 transition ${active ? 'border-bgap-cyan scale-110 shadow-neon-cyan' : 'border-bgap-border hover:border-bgap-muted'}`}
      style={{ background: color }}
    />
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={active} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${active ? 'bg-bgap-cyan/15 border-bgap-cyan text-bgap-cyan' : 'bg-bgap-card border-bgap-border text-bgap-muted hover:text-bgap-text'}`}>
      {children}
    </button>
  );
}

/**
 * Create your cadet before the first spawn (or edit it later from the menu): quick-pick one of six
 * cadets or set body, skin, hair and starter clothes yourself. Saved to your profile on the server.
 */
export function CharacterCreator() {
  const loaded = useWardrobe((s) => s.loaded);
  const profile = useWardrobe((s) => s.profile);
  const items = useWardrobe((s) => s.items);
  const byId = useWardrobe((s) => s.byId);
  const editing = useGameState((s) => s.isCreatorOpen);
  const setCreatorOpen = useGameState((s) => s.setCreatorOpen);
  const open = loaded && (!profile || editing);

  const [name, setName] = useState('');
  const [appearance, setAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [equipped, setEquipped] = useState<Equipped>(DEFAULT_EQUIPPED);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start from the saved cadet when editing.
  useEffect(() => {
    if (!open) return;
    if (profile) { setName(profile.name); setAppearance(profile.appearance); setEquipped(profile.equipped); }
    setError(null);
  }, [open, profile]);

  const starters = useMemo(() => {
    const by = (slot: Slot) => items.filter((i) => i.slot === slot && i.tags.includes('starter'));
    return { top: by('top'), bottom: by('bottom'), shoes: by('shoes') };
  }, [items]);
  const def = useMemo(() => cadetDef(appearance, equipped, byId, name || 'Cadet'), [appearance, equipped, byId, name]);

  if (!open) return null;
  const isNew = !profile;
  const set = (patch: Partial<Appearance>) => setAppearance((a) => ({ ...a, ...patch }));
  const setBody = (body: BodyType) => setAppearance((a) => ({ ...a, body, hair: HAIR_STYLES[body].includes(a.hair) ? a.hair : HAIR_STYLES[body][0] }));
  // Starter clothes only replace the matching slot; a bought dress is taken off when you pick a top.
  const wear = (slot: 'top' | 'bottom' | 'shoes', id: string) => setEquipped((e) => {
    const next: Equipped = { ...e, [slot]: id };
    if (slot !== 'shoes' && next.dress) { delete next.dress; next.top ??= starters.top[0]?.id; next.bottom ??= starters.bottom[0]?.id; }
    return next;
  });

  const randomise = () => {
    const body: BodyType = Math.random() < 0.5 ? 'female' : 'male';
    const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
    setAppearance({ body, skin: Math.floor(Math.random() * PALETTE.skin.length), skinTone: 0.9 + Math.random() * 0.2, hair: pick(HAIR_STYLES[body]), hairColor: pick(HAIR_COLORS) });
    setEquipped({ top: pick(starters.top).id, bottom: pick(starters.bottom).id, shoes: pick(starters.shoes).id });
    AudioManager.playUi('select');
  };

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveCadet({ name, appearance, equipped });
      AudioManager.playUi('confirm');
      setCreatorOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your cadet.');
      AudioManager.playUi('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div role="dialog" aria-label="Create your cadet" className="fixed inset-0 z-50 bg-[#070B13]/95 backdrop-blur-sm flex flex-col md:flex-row pointer-events-auto select-none">
      <div className="md:w-[45%] h-[38vh] md:h-full relative bg-gradient-to-b from-[#16233A] to-[#0B111D]">
        <CadetPreview def={def} className="absolute inset-0" />
        <div className="absolute top-4 left-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-bgap-cyan">BGAP Academy</div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-bgap-text">{isNew ? 'Create your cadet' : 'Edit your cadet'}</h1>
        </div>
        <div className="absolute bottom-3 inset-x-0 text-center text-[11px] text-bgap-muted">Drag to turn</div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6">
        {!isNew && (
          <button onClick={() => setCreatorOpen(false)} aria-label="Cancel" className="float-right w-9 h-9 rounded-full bg-bgap-card text-bgap-muted hover:text-bgap-text flex items-center justify-center"><X className="w-4 h-4" /></button>
        )}
        <Section title="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder="What should the city call you?"
            className="w-full max-w-sm px-3 py-2.5 rounded-xl bg-bgap-card border border-bgap-border text-bgap-text placeholder:text-bgap-muted/60 focus:border-bgap-cyan outline-none"
          />
        </Section>

        {isNew && (
          <Section title="Quick pick">
            <div className="flex flex-wrap gap-2">
              {PRESET_CADETS.map((p) => (
                <Chip key={p.label} active={false} onClick={() => { setAppearance(p.appearance); setEquipped(p.equipped); if (!name.trim()) setName(p.label); AudioManager.playUi('select'); }}>{p.label}</Chip>
              ))}
              <Chip active={false} onClick={randomise}><span className="inline-flex items-center gap-1"><Shuffle className="w-3.5 h-3.5" />Surprise me</span></Chip>
            </div>
          </Section>
        )}

        <Section title="Body">
          <div className="flex gap-2">
            <Chip active={appearance.body === 'female'} onClick={() => setBody('female')}>Body A</Chip>
            <Chip active={appearance.body === 'male'} onClick={() => setBody('male')}>Body B</Chip>
          </div>
        </Section>

        <Section title="Skin">
          <div className="flex flex-wrap gap-2.5">
            {PALETTE.skin.map((c, i) => <Swatch key={c} color={c} active={appearance.skin === i} onClick={() => set({ skin: i })} label={`Skin tone ${i + 1}`} />)}
          </div>
          <label className="flex items-center gap-3 text-xs text-bgap-muted max-w-sm">
            Shade
            <input type="range" min={0.8} max={1.2} step={0.01} value={appearance.skinTone} onChange={(e) => set({ skinTone: Number(e.target.value) })} className="flex-1 accent-cyan-400" />
          </label>
        </Section>

        <Section title="Hair">
          <div className="flex flex-wrap gap-2">
            {HAIR_STYLES[appearance.body].map((h) => <Chip key={h} active={appearance.hair === h} onClick={() => set({ hair: h })}>{HAIR_LABEL[h]}</Chip>)}
          </div>
          <div className="flex flex-wrap gap-2.5">
            {HAIR_COLORS.map((c) => <Swatch key={c} color={c} active={appearance.hairColor === c} onClick={() => set({ hairColor: c })} label={`Hair colour ${c}`} />)}
          </div>
        </Section>

        <Section title="Starter clothes">
          {(['top', 'bottom', 'shoes'] as const).map((slot) => (
            <div key={slot} className="flex items-center gap-3">
              <span className="w-14 text-xs text-bgap-muted capitalize">{slot}</span>
              <div className="flex flex-wrap gap-2.5">
                {starters[slot].map((it) => <Swatch key={it.id} color={it.color} active={equipped[slot] === it.id} onClick={() => wear(slot, it.id)} label={it.name} />)}
              </div>
            </div>
          ))}
          <p className="text-[11px] text-bgap-muted">Earn money from clients to buy ankara, suits and traditional wear at Zee Fabrics.</p>
        </Section>

        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 max-w-md">{error}</p>}

        <button
          onClick={submit}
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-bgap-cyan to-bgap-neon text-bgap-dark font-extrabold text-sm inline-flex items-center gap-2 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          {saving ? 'Saving…' : isNew ? 'Step into the city' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
