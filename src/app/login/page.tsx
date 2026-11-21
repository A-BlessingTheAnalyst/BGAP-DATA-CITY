'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabaseBrowser, safeNext } from '@/lib/supabaseBrowser';

// Sign in to Data City with your BGAP account (same accounts as bgap.app — one login for the whole
// platform). Most players arrive already signed in through /auth/handoff from the BGAP dashboard.

function LoginForm() {
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setMessage({ kind: 'error', text: error.message === 'Invalid login credentials' ? 'That email and password don’t match a BGAP account.' : error.message });
    else window.location.replace(next);
  };

  const magicLink = async () => {
    if (!email.trim()) { setMessage({ kind: 'error', text: 'Enter your email first.' }); return; }
    setBusy(true);
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setBusy(false);
    setMessage(error ? { kind: 'error', text: error.message } : { kind: 'info', text: 'Check your inbox for a sign-in link.' });
  };

  return (
    <form onSubmit={signIn} className="w-full max-w-sm bg-bgap-surface border border-bgap-border rounded-2xl p-6 space-y-4 shadow-hud-glass">
      <div>
        <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-bgap-cyan">BGAP · Data City</div>
        <h1 className="text-2xl font-extrabold text-bgap-text mt-1">Sign in to play</h1>
        <p className="text-xs text-bgap-muted mt-1">Use your BGAP account. Your wallet, cases and XP follow you across BGAP.</p>
      </div>
      <label className="block text-xs font-semibold text-bgap-text">Email
        <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full px-3 py-2.5 rounded-xl bg-bgap-card border border-bgap-border text-bgap-text outline-none focus:border-bgap-cyan" />
      </label>
      <label className="block text-xs font-semibold text-bgap-text">Password
        <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full px-3 py-2.5 rounded-xl bg-bgap-card border border-bgap-border text-bgap-text outline-none focus:border-bgap-cyan" />
      </label>
      {message && <p className={`text-xs ${message.kind === 'error' ? 'text-red-500' : 'text-bgap-emerald'}`}>{message.text}</p>}
      <button disabled={busy} className="w-full py-3 rounded-xl bg-bgap-cyan text-white font-extrabold text-sm disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'}</button>
      <button type="button" onClick={magicLink} disabled={busy} className="w-full py-2.5 rounded-xl bg-bgap-card border border-bgap-border text-bgap-text font-semibold text-xs">Email me a sign-in link instead</button>
      <p className="text-[11px] text-bgap-muted text-center">No account? <a className="text-bgap-cyan underline" href="https://bgap.app/login">Create one on BGAP</a></p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-bgap-dark flex items-center justify-center p-6">
      <Suspense fallback={null}><LoginForm /></Suspense>
    </main>
  );
}
