-- 0005: Data City ↔ BGAP platform integration (shared Supabase project with bgap-academy).
--
-- What this adds, all additive and idempotent (safe to re-run):
--   1. datacity_record_completion(): mirrors a passed Data City mission into BGAP's own
--      public.challenge_completions + public.users XP/challenge counters, so Data City work shows on
--      the BGAP dashboard, leaderboard and portfolio exactly like a workspace challenge does.
--   2. workspace_launches: spreadsheet missions are solved in workspace.bgap.app; Data City records
--      each launch and later verifies completion against challenge_completions (no trust in the browser).
--   3. datacity_player_summary: one row per player for bgap-academy's backend (/api/v1/datacity/summary).
--   4. Hardening: grants, helpful indexes, updated_at touch trigger for player_profiles.
--
-- Depends on: bgap-academy supabase-setup/01_schema.sql (public.users, public.challenge_completions)
-- and Data City migrations 0001–0004.

-- ───────────────────────────── 1. Mirror completions into BGAP ─────────────────────────────
-- Title convention: 'Data City · <mission title>' — unique per user via BGAP's existing
-- challenge_completions_user_title_key, so a mission can never be counted (or award XP) twice.
CREATE OR REPLACE FUNCTION public.datacity_record_completion(
    p_user_id UUID,
    p_mission_id TEXT,
    p_title TEXT,
    p_tool TEXT,
    p_level TEXT,
    p_xp INTEGER,
    p_score INTEGER,
    p_feedback TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_title TEXT := left('Data City · ' || coalesce(nullif(p_title, ''), p_mission_id), 200);
    v_rows INTEGER := 0;
BEGIN
    -- Only accounts that exist on the BGAP platform (public.users) are mirrored.
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_user_id) THEN
        RETURN FALSE;
    END IF;

    INSERT INTO public.challenge_completions (user_id, challenge_title, challenge_tool, challenge_level, xp_earned, score, feedback)
    VALUES (
        p_user_id, v_title,
        CASE WHEN p_tool IN ('python', 'sql', 'excel', 'powerbi') THEN p_tool ELSE 'sql' END,
        CASE WHEN p_level IN ('Beginner', 'Intermediate', 'Advanced') THEN p_level ELSE 'Beginner' END,
        greatest(0, coalesce(p_xp, 0)), p_score, left(p_feedback, 2000)
    )
    ON CONFLICT (user_id, challenge_title) DO NOTHING;
    GET DIAGNOSTICS v_rows = ROW_COUNT;

    IF v_rows > 0 THEN
        UPDATE public.users
           SET xp_points = coalesce(xp_points, 0) + greatest(0, coalesce(p_xp, 0)),
               challenges_completed = coalesce(challenges_completed, 0) + 1,
               last_active = now()
         WHERE id = p_user_id;
    END IF;
    RETURN v_rows > 0;
END;
$$;
REVOKE ALL ON FUNCTION public.datacity_record_completion(UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;

-- ───────────────────────────── 2. Workspace (spreadsheet) launches ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.workspace_launches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mission_id VARCHAR(80) NOT NULL,
    -- Exactly the challenge_title the workspace will write on completion.
    challenge_title TEXT NOT NULL,
    tool VARCHAR(16) NOT NULL DEFAULT 'excel',
    launched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    verified_at TIMESTAMPTZ,
    score INTEGER,
    UNIQUE (user_id, mission_id)
);
CREATE INDEX IF NOT EXISTS workspace_launches_user_idx ON public.workspace_launches (user_id, launched_at DESC);
ALTER TABLE public.workspace_launches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS workspace_launches_select_own ON public.workspace_launches;
CREATE POLICY workspace_launches_select_own ON public.workspace_launches FOR SELECT USING (auth.uid() = user_id);

-- ───────────────────────────── 3. One summary row per player ─────────────────────────────
-- security_invoker: callers with a user JWT only see their own rows (RLS on the base tables);
-- bgap-academy's backend uses the service role and filters by user id itself.
CREATE OR REPLACE VIEW public.datacity_player_summary WITH (security_invoker = true) AS
SELECT
    u.user_id,
    coalesce((SELECT sum(l.amount) FROM public.wallet_ledger l WHERE l.user_id = u.user_id), 0)::BIGINT AS balance,
    coalesce((SELECT sum(l.xp) FROM public.wallet_ledger l WHERE l.user_id = u.user_id), 0)::BIGINT AS xp,
    (SELECT count(*) FROM public.game_attempts a WHERE a.user_id = u.user_id AND a.status = 'passed') AS missions_passed,
    (SELECT count(*) FROM public.game_attempts a WHERE a.user_id = u.user_id AND a.status = 'open') AS missions_open,
    (SELECT array_agg(DISTINCT a.mission_id) FROM public.game_attempts a WHERE a.user_id = u.user_id AND a.status = 'passed') AS passed_mission_ids,
    p.name AS cadet_name,
    greatest(
        (SELECT max(l.created_at) FROM public.wallet_ledger l WHERE l.user_id = u.user_id),
        (SELECT max(a.started_at) FROM public.game_attempts a WHERE a.user_id = u.user_id),
        p.updated_at
    ) AS last_played
FROM (
    SELECT user_id FROM public.player_profiles
    UNION SELECT user_id FROM public.wallet_ledger
    UNION SELECT user_id FROM public.game_attempts
) u
LEFT JOIN public.player_profiles p ON p.user_id = u.user_id;

REVOKE ALL ON public.datacity_player_summary FROM anon;
GRANT SELECT ON public.datacity_player_summary TO authenticated;

-- ───────────────────────────── 4. Hardening and housekeeping ─────────────────────────────
CREATE INDEX IF NOT EXISTS wallet_ledger_mission_idx ON public.wallet_ledger (user_id, mission_id) WHERE mission_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS game_attempts_status_idx ON public.game_attempts (user_id, status);

CREATE OR REPLACE FUNCTION public.datacity_touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS player_profiles_touch ON public.player_profiles;
CREATE TRIGGER player_profiles_touch BEFORE UPDATE ON public.player_profiles
    FOR EACH ROW EXECUTE FUNCTION public.datacity_touch_updated_at();
DROP TRIGGER IF EXISTS garage_vehicles_touch ON public.garage_vehicles;
CREATE TRIGGER garage_vehicles_touch BEFORE UPDATE ON public.garage_vehicles
    FOR EACH ROW EXECUTE FUNCTION public.datacity_touch_updated_at();

-- Browsers never write game tables directly; only the server (service role) does.
REVOKE INSERT, UPDATE, DELETE ON public.wallet_ledger, public.game_attempts, public.player_profiles, public.garage_vehicles, public.workspace_launches FROM anon, authenticated;
