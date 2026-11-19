export interface AuthSession {
  userId: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
}

// Was a stub until 19 Nov 2026 (owner feedback: "use the backend and database of the main bgap
// game"): any Bearer token that wasn't literally the string "invalid" was accepted and mapped to
// a hardcoded fake user — a real auth bypass, not just unfinished wiring. Now verifies the token
// as a real Supabase session against the shared BGAP project (same `auth.users`/`public.users`
// bgap-academy's own middleware.js reads), with a dev-only mock identity kept for local work
// without a live session. See masterprompt.md §15.3 for the wider backend/database plan.

// A fixed dev-only placeholder id, shared with app/game/page.tsx's own fallback. Must be a real
// UUID literal (not an arbitrary string like the old "dev-cadet-analyst") — found live 19 Nov
// 2026, the first time this session could actually run the app against real credentials: wallet/
// garage/profile reads against the now-real Supabase project throw "invalid input syntax for
// type uuid" the instant local dev hits them, because every user_id column is UUID-typed. This
// id won't match any real auth.users row even once the migrations run, so local dev against the
// live project still won't have real data for it — it just stops the immediate crash.
export const DEV_USER_ID = '00000000-0000-4000-8000-000000000001';

function supabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY && url.startsWith('https://') && !url.includes('your-project') && !url.includes('placeholder');
}

/** BGAP's own role vocabulary (public.users.role: student/instructor/admin/manager/hr_admin/
 * candidate/portfolio_user) collapsed onto the handful Data City's game logic branches on —
 * every role outside student/instructor/admin plays the game as a student, which is the right
 * default for, say, an HR admin's BGAP account visiting Data City. */
function mapRole(bgapRole: string | null | undefined): AuthSession['role'] {
  if (bgapRole === 'admin') return 'admin';
  if (bgapRole === 'instructor') return 'instructor';
  return 'student';
}

export class SessionValidator {
  static async validateSession(authHeader?: string | null): Promise<AuthSession> {
    const isDev = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_DEV_MOCK_AUTH === 'true';
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null;

    if (token && supabaseConfigured()) {
      const { supabaseAdmin } = await import('@/server/db/supabase');
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        const { data: row } = await supabaseAdmin.from('users').select('role, email').eq('id', data.user.id).maybeSingle();
        return {
          userId: data.user.id,
          email: (row?.email as string | undefined) ?? data.user.email ?? '',
          role: mapRole(row?.role as string | undefined),
        };
      }
      // A token was sent but didn't verify: in production that's a real auth failure, not a
      // reason to fall through to the dev mock identity.
      if (!isDev) throw new Error('Unauthorized: invalid or expired BGAP session.');
    }

    // Local development without a live Supabase session (or Supabase not configured yet).
    if (isDev) {
      return {
        userId: DEV_USER_ID,
        email: 'cadet@aidlearn.org',
        role: 'student',
      };
    }

    throw new Error('Unauthorized: Valid BGAP session required.');
  }
}
