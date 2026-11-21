'use client';
import { useState } from 'react';
import { ExternalLink, RefreshCw, Table2 } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { refreshWallet } from '../../game/ui/phone/useCareer';
import { useGameState } from '../../game/engine/GameState';
import { AudioManager } from '../../game/audio/AudioManager';

// A spreadsheet case is worked in BGAP's Excel workspace (workspace.bgap.app), the platform's one
// real spreadsheet engine, then checked back here. Same handoff bgap.app's Challenge Lab uses: the
// signed-in player's tokens ride in the URL #hash so the workspace opens already signed in.

export function WorkspacePanel({ missionId, deliverables, clientName }: { missionId: string; deliverables: string[]; clientName: string }) {
  const [busy, setBusy] = useState<'launch' | 'verify' | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const call = async (action: 'launch' | 'verify') => {
    const r = await fetch('/api/game/workspace', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ missionId, action }) });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error ?? 'Workspace unavailable');
    return data;
  };

  const launch = async () => {
    setBusy('launch'); setNote(null);
    // Open the tab synchronously (popup blockers), then point it at the workspace.
    const tab = window.open('about:blank', '_blank');
    try {
      const { url } = await call('launch');
      const { data } = await supabaseBrowser().auth.getSession();
      const s = data.session;
      const hash = s ? `#access_token=${encodeURIComponent(s.access_token)}&refresh_token=${encodeURIComponent(s.refresh_token)}` : '';
      if (tab) tab.location.href = url + hash; else window.location.href = url + hash;
      setNote({ ok: true, text: 'The workspace opened in a new tab. Finish the tasks there, press Submit, then come back and check your result.' });
    } catch (e) {
      tab?.close();
      setNote({ ok: false, text: e instanceof Error ? e.message : 'Could not open the workspace.' });
    } finally { setBusy(null); }
  };

  const verify = async () => {
    setBusy('verify'); setNote(null);
    try {
      const out = await call('verify');
      if (out.completed) {
        AudioManager.playUi('confirm');
        useGameState.getState().markMissionCompleted(missionId);
        refreshWallet();
        setNote({ ok: true, text: out.alreadyPaid ? `Already paid. Score ${out.score}.` : `${clientName} is happy. Score ${out.score}, payment received.` });
      } else {
        AudioManager.playUi('error');
        setNote({ ok: false, text: out.reason });
      }
    } catch (e) {
      setNote({ ok: false, text: e instanceof Error ? e.message : 'Could not check your result.' });
    } finally { setBusy(null); }
  };

  return (
    <div className="p-5 space-y-4 overflow-y-auto">
      <div className="flex items-center gap-2 text-bgap-text font-bold"><Table2 className="w-5 h-5 text-bgap-emerald" />A spreadsheet job</div>
      <p className="text-xs text-bgap-muted">{clientName} wants this done in a spreadsheet. It opens in your BGAP Workspace with the data already loaded; the tasks there are checked automatically.</p>
      <ol className="list-decimal pl-5 space-y-1 text-xs text-bgap-text">{deliverables.map((d, i) => <li key={i}>{d}</li>)}</ol>
      <div className="flex flex-wrap gap-2">
        <button onClick={launch} disabled={!!busy} className="px-4 py-2.5 rounded-xl bg-bgap-cyan text-white font-bold text-xs inline-flex items-center gap-1.5 disabled:opacity-50">
          <ExternalLink className="w-3.5 h-3.5" />{busy === 'launch' ? 'Opening…' : 'Open in BGAP Workspace'}
        </button>
        <button onClick={verify} disabled={!!busy} className="px-4 py-2.5 rounded-xl bg-bgap-card border border-bgap-border text-bgap-text font-bold text-xs inline-flex items-center gap-1.5 disabled:opacity-50">
          <RefreshCw className="w-3.5 h-3.5" />{busy === 'verify' ? 'Checking…' : 'I submitted — check my result'}
        </button>
      </div>
      {note && <p className={`text-xs ${note.ok ? 'text-bgap-emerald' : 'text-red-500'}`}>{note.text}</p>}
    </div>
  );
}
