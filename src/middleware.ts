import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Keeps the BGAP (Supabase) session cookie fresh on every game page/API request, so access tokens
// refreshed here are what SessionValidator reads. Standard @supabase/ssr middleware pattern.
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!url.startsWith('https://') || !anon || url.includes('placeholder') || url.includes('your-project')) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // Touching the user refreshes an expired access token using the refresh token cookie.
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ['/game/:path*', '/api/game/:path*', '/login', '/auth/:path*'],
};
