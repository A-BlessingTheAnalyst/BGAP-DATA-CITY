-- Phase B: the player's cadet (look and equipped outfit) and safe spending.
-- Ownership of outfit items is not a separate table: a purchase is a negative wallet_ledger row
-- with idempotency_key 'buy:<itemId>', so an item can never be bought (or charged) twice.

CREATE TABLE IF NOT EXISTS player_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(24) NOT NULL,
    appearance JSONB NOT NULL,      -- { body, skin, skinTone, hair, hairColor }
    equipped JSONB NOT NULL,        -- { top?, bottom?, dress?, shoes, head? } item ids
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS player_profiles_select_own ON player_profiles;
CREATE POLICY player_profiles_select_own ON player_profiles FOR SELECT USING (auth.uid() = user_id);

-- Spend money only if the balance covers it, once per idempotency key, atomically.
-- Called by the server (service role) through supabase.rpc('wallet_debit', …).
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
    -- One spender at a time per player.
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
