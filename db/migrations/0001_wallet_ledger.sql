-- Phase A: the wallet ledger. Every naira a player earns or spends is one row.
-- Balance = SUM(amount). Rewards are written only by the server's grader route (service role);
-- the unique (user_id, idempotency_key) constraint makes a reward impossible to grant twice.

CREATE TABLE IF NOT EXISTS wallet_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,                 -- positive = earning, negative = purchase
    kind VARCHAR(20) NOT NULL CHECK (kind IN ('earning', 'purchase', 'grant')),
    reason TEXT NOT NULL,
    mission_id VARCHAR(80),
    xp INTEGER NOT NULL DEFAULT 0,
    idempotency_key VARCHAR(160) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS wallet_ledger_user_idx ON wallet_ledger (user_id, created_at DESC);

ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;

-- Players can read their own ledger. Nobody writes from the browser: inserts come from the
-- server with the service role, which bypasses RLS.
DROP POLICY IF EXISTS wallet_ledger_select_own ON wallet_ledger;
CREATE POLICY wallet_ledger_select_own ON wallet_ledger FOR SELECT USING (auth.uid() = user_id);
