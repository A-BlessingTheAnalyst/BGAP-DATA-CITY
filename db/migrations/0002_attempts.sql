-- Phase A: server-side attempts. The grader reads hint usage and start time from here,
-- never from the browser. One open attempt per player and mission (reopening resumes it).
-- Written only by the server (service role); players may read their own.

CREATE TABLE IF NOT EXISTS game_attempts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mission_id VARCHAR(80) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    hint_log JSONB NOT NULL DEFAULT '[]'::jsonb,     -- [{ "index": 0, "at": "…" }, …] in reveal order
    draft TEXT,
    submissions INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'passed')),
    last_result JSONB
);

CREATE INDEX IF NOT EXISTS game_attempts_user_idx ON game_attempts (user_id, mission_id);
-- At most one open attempt per player and mission.
CREATE UNIQUE INDEX IF NOT EXISTS game_attempts_one_open ON game_attempts (user_id, mission_id) WHERE status = 'open';

ALTER TABLE game_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS game_attempts_select_own ON game_attempts;
CREATE POLICY game_attempts_select_own ON game_attempts FOR SELECT USING (auth.uid() = user_id);
