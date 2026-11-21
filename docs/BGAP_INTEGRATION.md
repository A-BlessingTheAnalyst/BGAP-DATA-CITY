# Data City ↔ BGAP platform integration

*21 November 2026. How Data City now plugs into the main BGAP stack: one Supabase project, one login, one XP/progress record, and one spreadsheet engine.*

## The three systems

| System | Repo | Role |
|---|---|---|
| **bgap.app** (Next.js frontend + Express backend on `/api/v1`) | `bgap-academy/` | Accounts, dashboard, Challenge Lab, XP, leaderboard, portfolio |
| **workspace.bgap.app** | `BGAP-practice-workspace/` | The real Excel / SQL / Python practice workspace. Launched with challenge data in query params and Supabase tokens in the `#hash`. Grades and writes `public.challenge_completions` and `users.xp_points`. |
| **Data City** | `DATA CITY/` | The 3D analyst-career game, with its own SQL terminal + DuckDB grader |

All three share **one Supabase project**: `auth.users` → `public.users` (role, plan, `xp_points`, `challenges_completed`).

## What's wired now

### 1. One login (sign in once, play anywhere)
- **From the BGAP dashboard:** open `GET /api/v1/datacity/launch` (backend), then append the learner's session as `#access_token=…&refresh_token=…`. This is the same handoff the dashboard already uses for the workspace. Data City's `/auth/handoff` turns the hash into its own cookie session, scrubs the URL, and enters `/game`.
- **Directly:** `/login` signs in with the same BGAP email/password, or a one-time email link (`/auth/callback`, PKCE). No new accounts are created there; sign-up stays on bgap.app.
- **Server side:** `src/middleware.ts` refreshes the cookie. `SessionValidator` accepts either a Bearer token or the cookie. `/game` now **redirects to `/login`** instead of silently becoming the fake dev player.
- **Local dev:** set `DATA_CITY_DEV_USER_ID` in `.env.local` to your own `auth.users` id. Otherwise dev writes fail with `*_user_id_fkey` (seen live: profile save and case start both failed on the placeholder id).

### 2. City work counts on BGAP
Every passed mission calls `datacity_record_completion()` (migration **0005**). It inserts a `challenge_completions` row titled `Data City · <mission title>`, unique per user so XP is never double-counted, and adds the XP to `users.xp_points` and `challenges_completed`. Data City cases then show up on the dashboard, leaderboard and portfolio just like Challenge Lab work.

### 3. Spreadsheet cases use the real workspace
A mission with a `workspace` block (`{ tool, deliverables, checks, passScore }`) opens a **"Open in BGAP Workspace"** panel instead of the SQL terminal:
1. `POST /api/game/workspace {action:'launch'}` records `workspace_launches` and builds the workspace URL (brief, deliverables, checks, the case's dataset as `starter_data`, and `return_to`).
2. The player solves it in the workspace. The workspace grades it and writes `challenge_completions` with that exact title. Its result screen now has a **"Back to Data City to get paid"** button (allowlisted `return_to`: `*.bgap.app`, localhost, or `NEXT_PUBLIC_RETURN_TO_ORIGINS`).
3. `POST /api/game/workspace {action:'verify'}` reads the completion **server-side**, pays once through the idempotent wallet ledger, and marks the launch verified.

### 4. Backend endpoints (`bgap-academy/backend`)
| Endpoint | Auth | Returns |
|---|---|---|
| `GET /api/v1/datacity/summary` | Bearer | balance, xp, missions passed/open, cadet name, last played, 5 most recent city completions. Reports `ready:false` (not an error) if 0005 hasn't run. |
| `GET /api/v1/datacity/leaderboard?limit=20` | Bearer | top cadets by city XP (cadet names only) |
| `GET /api/v1/datacity/launch` | Bearer | the Data City handoff URL (`DATA_CITY_URL` env) |

## Database: what to run
`db/migrations/0001–0004` are already live (the tables exist; the errors seen were foreign-key errors, not missing tables).

**Run `db/migrations/0005_bgap_integration.sql` once** in the Supabase SQL editor. It is additive and idempotent:
- `datacity_record_completion()` (SECURITY DEFINER; service role only)
- `workspace_launches` table + RLS
- `datacity_player_summary` view (`security_invoker`)
- indexes, `updated_at` triggers, and revoking browser writes on game tables

## Environment variables
| Where | Variable | Value |
|---|---|---|
| Data City (Vercel) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | same project as bgap.app (already set) |
| Data City (Vercel) | `NEXT_PUBLIC_WORKSPACE_URL` | `https://workspace.bgap.app` |
| Data City (local only) | `DATA_CITY_DEV_USER_ID` | your own auth.users id (never in Vercel) |
| Backend | `DATA_CITY_URL` | Data City's public URL |
| Backend | `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `TAVILY_API_KEY` | **must be set**: the hard-coded fallbacks were removed |
| Workspace (optional) | `NEXT_PUBLIC_RETURN_TO_ORIGINS` | extra allowed return origins, e.g. a Vercel preview URL for Data City |
| Supabase Auth → URL config | Redirect URLs | add `<data-city-url>/auth/callback` |

## ⚠️ Security: rotate these keys
`bgap-academy/backend` had live secrets hard-coded as fallbacks, so they are in git history:
- Supabase **service-role** key (`src/config/supabase.js`): full database access, bypasses RLS
- Resend API key (`emailController.js`, `newsletterController.js`)
- Tavily API key (`microsoftSyncService.js`)

The fallbacks are removed in this change, but the values remain in history. **Rotate all three** (Supabase: Settings → API → roll the service_role key), then update every host that uses them (backend, bgap.app frontend, workspace, Data City).

## Still to do
- A **"Play Data City"** card on the bgap.app dashboard: call `/api/v1/datacity/launch`, append the session hash and open it. Show `/summary` next to it.
- Author the first spreadsheet missions (add a `workspace` block to a mission JSON).
- Production Python missions still need the execution time limit (PROJECT_STATUS §3.1).
