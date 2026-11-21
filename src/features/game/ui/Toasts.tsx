'use client';
import { useEffect } from 'react';
import { create } from 'zustand';
import { Lightbulb, X } from 'lucide-react';
import { useHudPrefs } from './hudPrefs';

// Short, self-dismissing guidance popups — the replacement for permanent key-hint text on the HUD.
// `once` tips show a single time per browser (e.g. the driving controls on your first drive).

interface Toast { id: string; text: string; at: number; ttl: number }

const useToasts = create<{ list: Toast[] }>(() => ({ list: [] }));
const SEEN_KEY = 'datacity.tipsSeen';

function seen(): string[] {
  try { return JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? '[]'); } catch { return []; }
}

export function pushToast(text: string, opts: { id?: string; once?: boolean; ttl?: number } = {}) {
  const id = opts.id ?? text;
  if (opts.once) {
    if (!useHudPrefs.getState().showTips) return;
    const s = seen();
    if (s.includes(id)) return;
    try { window.localStorage.setItem(SEEN_KEY, JSON.stringify([...s, id])); } catch { /* storage blocked */ }
  }
  useToasts.setState((st) => ({ list: [...st.list.filter((t) => t.id !== id), { id, text, at: Date.now(), ttl: opts.ttl ?? 5000 }].slice(-3) }));
}

const dismiss = (id: string) => useToasts.setState((st) => ({ list: st.list.filter((t) => t.id !== id) }));

export function Toasts() {
  const list = useToasts((s) => s.list);
  useEffect(() => {
    if (!list.length) return;
    const next = Math.min(...list.map((t) => t.at + t.ttl)) - Date.now();
    const timer = window.setTimeout(() => useToasts.setState((st) => ({ list: st.list.filter((t) => t.at + t.ttl > Date.now() + 50) })), Math.max(50, next));
    return () => window.clearTimeout(timer);
  }, [list]);
  if (!list.length) return null;
  return (
    // Lower centre: clear of the minimap, the status buttons and the tracker pill, and on touch
    // between the two thumb clusters (which is why it's capped at 46vw there).
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 w-[min(92vw,420px)] [@media(pointer:coarse)]:w-[min(46vw,420px)] [@media(pointer:coarse)]:bottom-4 pointer-events-none" role="status" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className="pointer-events-auto flex items-start gap-2 bg-bgap-surface/95 border border-bgap-border rounded-xl px-3 py-2 shadow-hud-glass text-xs text-bgap-text">
          <Lightbulb className="w-3.5 h-3.5 text-bgap-gold shrink-0 mt-0.5" />
          <span className="flex-1 leading-snug">{t.text}</span>
          <button onClick={() => dismiss(t.id)} aria-label="Dismiss tip" className="text-bgap-muted hover:text-bgap-text -mr-1"><X className="w-3.5 h-3.5" /></button>
        </div>
      ))}
    </div>
  );
}
