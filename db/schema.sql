-- =============================================================================
-- BGAP 3D GAME: DATA CITY — AUTHORITATIVE DATABASE SCHEMA & RLS
-- Integrates with BGAP's canonical auth.users table in PostgreSQL / Supabase
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Player Game Profiles (Shared 1-to-1 identity with BGAP auth.users)
CREATE TABLE IF NOT EXISTS game_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    avatar_id VARCHAR(50) DEFAULT 'default_analyst_m',
    avatar_config JSONB DEFAULT '{"outfit": "casual_business", "color_scheme": "emerald", "accessories": []}'::jsonb,
    level INTEGER DEFAULT 1,
    current_xp INTEGER DEFAULT 0,
    credits INTEGER DEFAULT 100,
    reputation_score INTEGER DEFAULT 0,
    career_rank VARCHAR(50) DEFAULT 'Trainee Analyst',
    spawn_zone VARCHAR(50) DEFAULT 'academy_plaza',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Published Missions (Public learner metadata — NO answers or gold queries)
CREATE TABLE IF NOT EXISTS game_missions (
    id VARCHAR(50) PRIMARY KEY,
    chapter INTEGER NOT NULL DEFAULT 1,
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    briefing TEXT NOT NULL,
    primary_skill VARCHAR(50) NOT NULL,
    difficulty_level VARCHAR(20) DEFAULT 'Beginner',
    estimated_minutes INTEGER DEFAULT 15,
    reward_xp INTEGER DEFAULT 150,
    reward_credits INTEGER DEFAULT 500,
    badge_id VARCHAR(50),
    is_published BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Private Mission Rubrics (Server-only table — strictly protected from public access)
CREATE TABLE IF NOT EXISTS game_mission_rubrics (
    mission_id VARCHAR(50) PRIMARY KEY REFERENCES game_missions(id) ON DELETE CASCADE,
    gold_query TEXT NOT NULL,
    expected_explanation_id VARCHAR(100) NOT NULL,
    passing_score NUMERIC(5, 2) DEFAULT 75.00,
    rubric_weights JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Mission Attempts (Tracks live player sessions)
CREATE TABLE IF NOT EXISTS mission_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mission_id VARCHAR(50) NOT NULL REFERENCES game_missions(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    current_step INTEGER DEFAULT 1,
    draft_query TEXT,
    hints_used INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_interaction_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Mission Submissions (Immutable analytical attempt audit trail)
CREATE TABLE IF NOT EXISTS mission_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES mission_attempts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mission_id VARCHAR(50) NOT NULL REFERENCES game_missions(id) ON DELETE CASCADE,
    submitted_query TEXT NOT NULL,
    explanation_choice VARCHAR(100),
    is_passed BOOLEAN NOT NULL,
    total_score NUMERIC(5, 2) NOT NULL,
    score_breakdown JSONB NOT NULL,
    feedback_notes TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Skill Mastery Radar (Separate academic development score)
CREATE TABLE IF NOT EXISTS skill_mastery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_key VARCHAR(50) NOT NULL,
    mastery_score NUMERIC(5, 2) DEFAULT 0.00,
    assessments_count INTEGER DEFAULT 0,
    last_assessed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_key)
);

-- 7. Reward Ledger (Deterministic once-only XP & Credit grants)
CREATE TABLE IF NOT EXISTS reward_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency_type VARCHAR(20) NOT NULL,
    amount INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL,
    idempotency_key VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, idempotency_key)
);

-- 8. World Checkpoints (Saved character position & orientation)
CREATE TABLE IF NOT EXISTS world_checkpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    zone_id VARCHAR(50) NOT NULL,
    position_x NUMERIC(8, 3) NOT NULL DEFAULT 0.0,
    position_y NUMERIC(8, 3) NOT NULL DEFAULT 0.0,
    position_z NUMERIC(8, 3) NOT NULL DEFAULT 0.0,
    rotation_y NUMERIC(8, 3) NOT NULL DEFAULT 0.0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE game_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_mission_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_checkpoints ENABLE ROW LEVEL SECURITY;

-- game_profiles: owner can read and update their own profile
CREATE POLICY "Users can read own game profile" ON game_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own game profile" ON game_profiles FOR UPDATE USING (auth.uid() = user_id);

-- game_missions: all authenticated users can view published missions
CREATE POLICY "Authenticated users can read published missions" ON game_missions FOR SELECT USING (auth.role() = 'authenticated' AND is_published = true);

-- game_mission_rubrics: NO PUBLIC ACCESS (service role only)

-- mission_attempts: owner can read, insert, and update draft on their attempts
CREATE POLICY "Users can read own mission attempts" ON mission_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mission attempts" ON mission_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mission attempts" ON mission_attempts FOR UPDATE USING (auth.uid() = user_id);

-- mission_submissions: owner can read their submissions
CREATE POLICY "Users can read own submissions" ON mission_submissions FOR SELECT USING (auth.uid() = user_id);

-- skill_mastery: owner can read their mastery radar
CREATE POLICY "Users can read own skill mastery" ON skill_mastery FOR SELECT USING (auth.uid() = user_id);

-- reward_ledger: owner can view their reward transaction history
CREATE POLICY "Users can view own reward ledger" ON reward_ledger FOR SELECT USING (auth.uid() = user_id);

-- world_checkpoints: owner can read and update their checkpoint
CREATE POLICY "Users can read own checkpoint" ON world_checkpoints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upsert own checkpoint" ON world_checkpoints FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mission_attempts_user ON mission_attempts(user_id, mission_id);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_user ON reward_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_world_checkpoints_user ON world_checkpoints(user_id);
