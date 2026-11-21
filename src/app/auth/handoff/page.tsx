'use client';
import { useEffect, useState } from 'react';
import { supabaseBrowser, safeNext } from '@/lib/supabaseBrowser';

// Arriving from bgap.app: the dashboard opens
//   https://<data-city>/auth/handoff?next=/game#access_token=…&refresh_token=…
// (the same token-in-hash handoff bgap.app already uses for workspace.bgap.app). The hash never
// reaches any server; we turn it into this site's own session cookie, scrub it from the address
// bar and history, then go into the city.
export default function HandoffPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const access = hash.get('access_token');
    const refresh = hash.get('refresh_token');
    const next = safeNext(new URLSearchParams(window.location.search).get('next'));
    // Remove the tokens from the URL immediately, whatever happens next.
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    if (!access || !refresh) {
      window.location.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    supabaseBrowser().auth.setSession({ access_token: access, refresh_token: refresh }).then(({ error: e }: { error: unknown }) => {
      if (e) setError('That sign-in link has expired. Open Data City again from your BGAP dashboard, or sign in here.');
      else window.location.replace(next);
    });
  }, []);

  return (
    <main className="min-h-screen bg-bgap-dark flex items-center justify-center p-6 text-center">
      {error ? (
        <div className="max-w-sm space-y-4">
          <p className="text-sm text-bgap-text">{error}</p>
          <a href="/login" className="inline-block px-5 py-2.5 rounded-xl bg-bgap-cyan text-white font-bold text-sm">Sign in</a>
        </div>
      ) : (
        <p className="text-sm text-bgap-muted">Signing you in with your BGAP account…</p>
      )}
    </main>
  );
}
