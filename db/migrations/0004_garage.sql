-- Phase D: where each owned car is parked. Ownership itself is a wallet_ledger purchase row
-- ('buy:<vehicleId>' / 'buy:driving_licence'), same pattern as outfits — only position needs its
-- own table, since a car moves around the city as the player calls or parks it.

CREATE TABLE IF NOT EXISTS garage_vehicles (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_id VARCHAR(80) NOT NULL,
    position JSONB NOT NULL,      -- [x, y, z]
    rotation_y REAL NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, vehicle_id)
);

ALTER TABLE garage_vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS garage_vehicles_select_own ON garage_vehicles;
CREATE POLICY garage_vehicles_select_own ON garage_vehicles FOR SELECT USING (auth.uid() = user_id);
