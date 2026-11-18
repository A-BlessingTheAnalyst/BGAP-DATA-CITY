'use client';
import React, { useEffect, useState } from 'react';
import { Briefcase, Wallet as WalletIcon, MapPin, Laptop, CheckCircle2, X, RefreshCw, Shirt } from 'lucide-react';
import { WardrobeApp } from '../wardrobe/WardrobeApp';
import { useGameState } from '../../engine/GameState';
import { AudioManager } from '../../audio/AudioManager';
import { loadMissions, naira, refreshWallet, useCareerStore } from './useCareer';
import type { PublicMission } from '@/shared/types/content';

// The DataPhone: the player's hub. Jobs lists story cases and today's generated gigs;
// Wallet shows the server ledger; Wardrobe changes outfits. Opens with Tab or the phone button.

type App = 'jobs' | 'wallet' | 'wardrobe';

const TIER_COLOUR = ['', 'text-emerald-400 border-emerald-400/50', 'text-cyan-300 border-cyan-300/50', 'text-indigo-300 border-indigo-300/50', 'text-amber-400 border-amber-400/50', 'text-rose-400 border-rose-400/50'];

function JobCard({ m }: { m: PublicMission }) {
  const done = useGameState((s) => s.completedMissions.includes(m.id));
  const tracked = useGameState((s) => s.trackedMissionId === m.id);
  const trackMission = useGameState((s) => s.trackMission);
  const openWorkstation = useGameState((s) => s.openWorkstation);
  return (
    <li className={`rounded-xl border p-3 space-y-2 ${tracked ? 'border-bgap-cyan bg-bgap-cyan/5' : 'border-bgap-border bg-bgap-card'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-bgap-text leading-snug">{m.title}</div>
          <div className="text-[11px] text-bgap-muted">{m.client.business}</div>
        </div>
        <span className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded border ${TIER_COLOUR[m.tier]}`}>T{m.tier}</span>
      </div>
      <p className="text-[11.5px] text-bgap-muted leading-snug">{m.summary}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-mono text-bgap-gold">{naira(m.pay)} · {m.skill}</span>
        {done ? (
          <span className="text-[11px] text-bgap-emerald inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Paid</span>
        ) : m.location.remote ? (
          <button onClick={() => { AudioManager.playUi('open'); openWorkstation(`ws:${m.id}`, m.id); }} className="text-[11px] px-2.5 py-1 rounded-lg bg-bgap-cyan text-bgap-dark font-bold inline-flex items-center gap-1">
            <Laptop className="w-3.5 h-3.5" /> Work remotely
          </button>
        ) : (
          <button onClick={() => { AudioManager.playUi('select'); trackMission(tracked ? null : m.id); }} className={`text-[11px] px-2.5 py-1 rounded-lg border inline-flex items-center gap-1 ${tracked ? 'border-bgap-cyan text-bgap-cyan' : 'border-bgap-border text-bgap-text'}`}>
            <MapPin className="w-3.5 h-3.5" /> {tracked ? 'Tracking' : 'Track'}
          </button>
        )}
      </div>
    </li>
  );
}

function Jobs() {
  const missions = useCareerStore((s) => s.missions);
  const error = useCareerStore((s) => s.missionsError);
  if (error) return <p className="text-xs text-red-400 p-3">The job board couldn’t load ({error}). <button className="underline" onClick={() => loadMissions(true)}>Try again</button></p>;
  if (!missions) return <p className="text-xs text-bgap-muted p-3">Loading jobs…</p>;
  const story = missions.filter((m) => m.kind === 'story');
  const gigs = missions.filter((m) => m.kind === 'gig');
  return (
    <div className="space-y-4">
      <section className="space-y-2">
        <h3 className="text-[11px] font-mono uppercase tracking-wider text-bgap-muted">Clients in the city</h3>
        <ul className="space-y-2">{story.map((m) => <JobCard key={m.id} m={m} />)}</ul>
      </section>
      <section className="space-y-2">
        <h3 className="text-[11px] font-mono uppercase tracking-wider text-bgap-muted">Today’s side gigs · remote</h3>
        <ul className="space-y-2">{gigs.map((m) => <JobCard key={m.id} m={m} />)}</ul>
      </section>
    </div>
  );
}

function Wallet() {
  const balance = useGameState((s) => s.walletBalance);
  const entries = useCareerStore((s) => s.entries);
  const xp = useCareerStore((s) => s.xp);
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-bgap-border bg-bgap-card p-4">
        <div className="text-[11px] text-bgap-muted">Balance</div>
        <div className="text-3xl font-bold text-bgap-text font-mono tabular-nums">{balance === null ? '…' : naira(balance)}</div>
        <div className="text-[11px] text-bgap-muted mt-1">{xp} XP earned</div>
      </div>
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-mono uppercase tracking-wider text-bgap-muted">Recent activity</h3>
        <button onClick={() => refreshWallet()} aria-label="Refresh wallet" className="text-bgap-muted hover:text-bgap-text"><RefreshCw className="w-3.5 h-3.5" /></button>
      </div>
      <ul className="divide-y divide-bgap-border/60">
        {entries.length === 0 && <li className="text-xs text-bgap-muted py-2">No activity yet. Finish a job to get paid.</li>}
        {entries.map((e) => (
          <li key={e.id} className="py-2 flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <div className="text-bgap-text truncate">{e.reason}</div>
              <div className="text-[10.5px] text-bgap-muted">{new Date(e.createdAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</div>
            </div>
            <span className={`font-mono tabular-nums ${e.amount >= 0 ? 'text-bgap-emerald' : 'text-red-400'}`}>{e.amount >= 0 ? '+' : '−'}{naira(Math.abs(e.amount))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DataPhone() {
  const open = useGameState((s) => s.isPhoneOpen);
  const setOpen = useGameState((s) => s.setPhoneOpen);
  const balance = useGameState((s) => s.walletBalance);
  const [app, setApp] = useState<App>('jobs');

  // Tab toggles the phone, Escape closes it. Ignored while typing, in dialogue or at a terminal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useGameState.getState();
      const el = e.target as HTMLElement | null;
      if (el?.closest?.('input, textarea, select, [contenteditable="true"]') || s.isWorkstationActive || s.isDialogueActive) return;
      if (e.code === 'Tab') {
        e.preventDefault();
        if (!s.isPhoneOpen) { loadMissions(); refreshWallet(); }
        AudioManager.playUi(s.isPhoneOpen ? 'close' : 'open');
        s.setPhoneOpen(!s.isPhoneOpen);
      } else if (e.code === 'Escape' && s.isPhoneOpen) {
        s.setPhoneOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return null;
  return (
    <div role="dialog" aria-label="DataPhone" className="absolute right-4 bottom-20 md:right-6 md:bottom-6 z-40 pointer-events-auto w-[min(360px,calc(100vw-2rem))] h-[min(620px,calc(100vh-7rem))] rounded-[28px] border-4 border-[#1b2333] bg-bgap-surface shadow-2xl flex flex-col overflow-hidden">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-bgap-border">
        <div>
          <div className="text-[10px] font-mono text-bgap-muted">DataPhone</div>
          <div className="text-sm font-bold text-bgap-text font-mono tabular-nums">{balance === null ? '…' : naira(balance)}</div>
        </div>
        <button onClick={() => setOpen(false)} aria-label="Close DataPhone" className="w-8 h-8 rounded-full bg-bgap-card text-bgap-muted hover:text-bgap-text flex items-center justify-center"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">{app === 'jobs' ? <Jobs /> : app === 'wallet' ? <Wallet /> : <WardrobeApp />}</div>
      <nav className="grid grid-cols-3 border-t border-bgap-border">
        {([['jobs', 'Jobs', Briefcase], ['wallet', 'Wallet', WalletIcon], ['wardrobe', 'Wardrobe', Shirt]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => { setApp(id); if (id === 'wallet') refreshWallet(); }} aria-pressed={app === id} className={`py-2.5 text-[11px] flex flex-col items-center gap-0.5 ${app === id ? 'text-bgap-cyan' : 'text-bgap-muted hover:text-bgap-text'}`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
