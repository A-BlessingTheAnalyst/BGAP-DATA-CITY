-- Data City's four migrations (0001-0004), concatenated for a single paste into bgap-academy's
-- Supabase project SQL editor (Dashboard → SQL Editor → New query), per masterprompt.md §15.3.
-- Safe to run against the live project: every statement is additive (CREATE TABLE IF NOT EXISTS /
-- DROP POLICY IF EXISTS then CREATE), new table names (wallet_ledger, game_attempts,
-- player_profiles, garage_vehicles) don't collide with anything in bgap-academy's own schema
-- (checked against supabase-setup/01_schema.sql and the frontend's own .from(...) calls), and
-- every row is scoped to auth.users(id) with RLS enabled, same as this project's own code expects.
-- This file is generated from 0001-0004; edit those, not this, then regenerate.

-- ============================== 0001_wallet_ledger.sql ==============================
CREATE TABLE IF NOT EXISTS wallet_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL,
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
DROP POLICY IF EXISTS wallet_ledger_select_own ON wallet_ledger;
CREATE POLICY wallet_ledger_select_own ON wallet_ledger FOR SELECT USING (auth.uid() = user_id);

-- ================================ 0002_attempts.sql ==================================
CREATE TABLE IF NOT EXISTS game_attempts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mission_id VARCHAR(80) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    hint_log JSONB NOT NULL DEFAULT '[]'::jsonb,
    draft TEXT,
    submissions INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(10) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'passed')),
    last_result JSONB
);
CREATE INDEX IF NOT EXISTS game_attempts_user_idx ON game_attempts (user_id, mission_id);
CREATE UNIQUE INDEX IF NOT EXISTS game_attempts_one_open ON game_attempts (user_id, mission_id) WHERE status = 'open';
ALTER TABLE game_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS game_attempts_select_own ON game_attempts;
CREATE POLICY game_attempts_select_own ON game_attempts FOR SELECT USING (auth.uid() = user_id);

-- ================================== 0003_shop.sql ====================================
CREATE TABLE IF NOT EXISTS player_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(24) NOT NULL,
    appearance JSONB NOT NULL,
    equipped JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS player_profiles_select_own ON player_profiles;
CREATE POLICY player_profiles_select_own ON player_profiles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION wallet_debit(
    p_user_id UUID, p_amount BIGINT, p_kind VARCHAR, p_reason TEXT, p_idempotency_key VARCHAR
) RETURNS TABLE (id UUID, user_id UUID, amount BIGINT, kind VARCHAR, reason TEXT, mission_id VARCHAR, xp INTEGER, idempotency_key VARCHAR, created_at TIMESTAMPTZ, created BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_balance BIGINT;
BEGIN
    IF p_amount > 0 THEN
        RAISE EXCEPTION 'wallet_debit only spends (amount must be <= 0)';
    END IF;
    PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

    RETURN QUERY SELECT l.id, l.user_id, l.amount, l.kind, l.reason, l.mission_id, l.xp, l.idempotency_key, l.created_at, FALSE
        FROM wallet_ledger l WHERE l.user_id = p_user_id AND l.idempotency_key = p_idempotency_key;
    IF FOUND THEN RETURN; END IF;

    SELECT COALESCE(SUM(l.amount), 0) INTO v_balance FROM wallet_ledger l WHERE l.user_id = p_user_id;
    IF v_balance + p_amount < 0 THEN
        RAISE EXCEPTION 'insufficient funds: balance %', v_balance;
    END IF;

    RETURN QUERY INSERT INTO wallet_ledger AS l (user_id, amount, kind, reason, mission_id, xp, idempotency_key)
        VALUES (p_user_id, p_amount, p_kind, p_reason, NULL, 0, p_idempotency_key)
        RETURNING l.id, l.user_id, l.amount, l.kind, l.reason, l.mission_id, l.xp, l.idempotency_key, l.created_at, TRUE;
END;
$$;
REVOKE ALL ON FUNCTION wallet_debit(UUID, BIGINT, VARCHAR, TEXT, VARCHAR) FROM PUBLIC, anon, authenticated;

-- ================================= 0004_garage.sql ===================================
CREATE TABLE IF NOT EXISTS garage_vehicles (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_id VARCHAR(80) NOT NULL,
    position JSONB NOT NULL,
    rotation_y REAL NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, vehicle_id)
);
ALTER TABLE garage_vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS garage_vehicles_select_own ON garage_vehicles;
CREATE POLICY garage_vehicles_select_own ON garage_vehicles FOR SELECT USING (auth.uid() = user_id);
