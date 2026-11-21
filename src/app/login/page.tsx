'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabaseBrowser, safeNext } from '@/lib/supabaseBrowser';

// Sign in to Data City with your BGAP account (same accounts as bgap.app; one login for the whole
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

  // Google, exactly like bgap.app (same Supabase project, same Google provider). Comes back through
  // /auth/callback, which exchanges the code for this site's session cookie.
  const google = async () => {
    setBusy(true);
    setMessage(null);
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) { setBusy(false); setMessage({ kind: 'error', text: error.message }); }
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
        <a href="/" aria-label="BGAP Data City home" className="inline-block mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/bgap-logo-blue.png" alt="BGAP" className="h-10 w-auto" />
        </a>
        <div className="text-[12px] font-extrabold uppercase tracking-[1px] text-[#1d4ed8]">Data City</div>
        <h1 className="text-2xl font-extrabold text-bgap-text mt-1">Sign in to play</h1>
        <p className="text-xs text-bgap-muted mt-1">Use your BGAP account. Your wallet, cases and XP follow you across BGAP.</p>
      </div>
      <button type="button" onClick={google} disabled={busy} className="w-full py-3 rounded-md bg-white border-[1.5px] border-slate-200 text-slate-700 font-bold text-[13.5px] flex items-center justify-center gap-2.5 hover:bg-slate-50 transition disabled:opacity-50">
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
        </svg>
        Continue with Google
      </button>
      <div className="flex items-center gap-3 text-[11px] text-slate-400"><span className="flex-1 h-px bg-slate-200" />or use email<span className="flex-1 h-px bg-slate-200" /></div>
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
