-- =============================================================================
-- BGAP 3D GAME: DATA CITY — DATABASE SCHEMA MIGRATION
-- Compatible with PostgreSQL 14+ / Supabase
-- Integrates with existing BGAP user authentication
-- =============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Player Game Profiles (1-to-1 with existing auth.users)
CREATE TABLE IF NOT EXISTS game_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE, -- Foreign key referencing existing auth.users(id)
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

-- 2. Game Missions Catalog
CREATE TABLE IF NOT EXISTS game_missions (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'ch1_cafe_revenue_mystery'
    chapter INTEGER NOT NULL DEFAULT 1,
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    briefing TEXT NOT NULL,
    primary_skill VARCHAR(50) NOT NULL, -- 'SQL', 'Excel', 'Python', 'PowerBI'
    difficulty_level VARCHAR(20) DEFAULT 'Beginner', -- 'Beginner', 'Intermediate', 'Advanced'
    estimated_minutes INTEGER DEFAULT 15,
    reward_xp INTEGER DEFAULT 150,
    reward_credits INTEGER DEFAULT 500,
    badge_id VARCHAR(50),
    is_published BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    rubric_config JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Mission Attempts (Tracks in-progress and past play sessions)
CREATE TABLE IF NOT EXISTS mission_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES game_profiles(user_id) ON DELETE CASCADE,
    mission_id VARCHAR(50) NOT NULL REFERENCES game_missions(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'active', -- 'active', 'analysis', 'submitted', 'completed', 'failed'
    current_step INTEGER DEFAULT 1,
    draft_query TEXT,
    hints_used INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_interaction_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Mission Submissions (Authoritative assessment records)
CREATE TABLE IF NOT EXISTS mission_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES mission_attempts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    mission_id VARCHAR(50) NOT NULL,
    submitted_query TEXT NOT NULL,
    explanation_choice VARCHAR(100),
    is_passed BOOLEAN NOT NULL,
    total_score NUMERIC(5, 2) NOT NULL, -- 0.00 to 100.00
    score_breakdown JSONB NOT NULL, -- { calculation: 50, filter: 20, reasoning: 20, independence: 10 }
    feedback_notes TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Skill Mastery Radar (Academic skill progression)
CREATE TABLE IF NOT EXISTS skill_mastery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    skill_key VARCHAR(50) NOT NULL, -- 'sql_filtering', 'sql_aggregation', 'sql_joins', 'business_metrics'
    mastery_score NUMERIC(5, 2) DEFAULT 0.00, -- 0 to 100
    assessments_count INTEGER DEFAULT 0,
    last_assessed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, skill_key)
);

-- 6. Reward Ledger (Audit trail for XP and BGAP Credits)
CREATE TABLE IF NOT EXISTS reward_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    currency_type VARCHAR(20) NOT NULL, -- 'XP', 'CREDITS'
    amount INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL, -- 'MISSION_COMPLETE:ch1_cafe_revenue_mystery'
    idempotency_key VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. World Checkpoints (Saved character position & zone)
CREATE TABLE IF NOT EXISTS world_checkpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    zone_id VARCHAR(50) NOT NULL,
    position_x NUMERIC(8, 3) NOT NULL DEFAULT 0.0,
    position_y NUMERIC(8, 3) NOT NULL DEFAULT 0.0,
    position_z NUMERIC(8, 3) NOT NULL DEFAULT 0.0,
    rotation_y NUMERIC(8, 3) NOT NULL DEFAULT 0.0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Game Telemetry & Performance Events
CREATE TABLE IF NOT EXISTS game_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    event_type VARCHAR(50) NOT NULL, -- 'world_loaded', 'fps_sample', 'shader_compile', 'interaction_trigger'
    device_category VARCHAR(20), -- 'desktop', 'mobile', 'tablet'
    graphics_profile VARCHAR(20), -- 'low', 'balanced', 'high'
    fps_average NUMERIC(5, 2),
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_mission_attempts_user_mission ON mission_attempts(user_id, mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_submissions_attempt ON mission_submissions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_user ON reward_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_mastery_user ON skill_mastery(user_id);
