import { NextResponse } from 'next/server';
import { supabaseFromCookies } from '@/server/db/supabaseSession';

// Email sign-in link landing (PKCE): exchange the one-time code for this site's session cookie.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next') ?? '/game';
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/game';
  if (code) {
    const { error } = await supabaseFromCookies().auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, url.origin));
}
