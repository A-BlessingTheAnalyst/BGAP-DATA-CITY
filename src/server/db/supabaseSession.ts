import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// The signed-in BGAP player's session, read from Supabase auth cookies (same Supabase project and
// auth.users as bgap.app and workspace.bgap.app). Set by /auth/handoff (arriving from bgap.app) or
// /login, kept fresh by src/middleware.ts.

export function supabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && url.startsWith('https://') && !url.includes('your-project') && !url.includes('placeholder');
}

/** Server client bound to this request's cookies (route handlers and server components). */
export function supabaseFromCookies() {
  const store = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        // Server components can't set cookies; middleware refreshes them instead.
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* read-only context */ }
      },
    },
  });
}

/** The verified user id + email from the cookie session, or null. */
export async function cookieUser(): Promise<{ id: string; email: string } | null> {
  if (!supabaseConfigured()) return null;
  try {
    const { data, error } = await supabaseFromCookies().auth.getUser();
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email ?? '' };
  } catch {
    return null; // no request scope (e.g. a script) or cookies unavailable
  }
}
