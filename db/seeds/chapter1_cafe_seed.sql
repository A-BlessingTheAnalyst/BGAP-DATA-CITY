-- =============================================================================
-- SEED DATA: CHAPTER 01 — THE CAFÉ REVENUE MYSTERY
-- =============================================================================

-- Seed Mission Definition
INSERT INTO game_missions (
    id, chapter, title, slug, briefing, primary_skill, difficulty_level,
    estimated_minutes, reward_xp, reward_credits, badge_id, is_published, version, rubric_config
) VALUES (
    'ch1_cafe_revenue_mystery',
    1,
    'The Café Revenue Mystery',
    'cafe-revenue-mystery',
    'Mama Bisi reports that her café has been packed every single day, yet her recorded monthly revenue dropped sharply. Investigate transaction records to calculate actual recognized daily revenue and uncover why gross sales deviate from true cash flow.',
    'SQL',
    'Beginner',
    15,
    150,
    500,
    'badge_cafe_sleuth',
    true,
    1,
    '{
        "weights": {
            "calculation": 50,
            "filter": 20,
            "explanation": 20,
            "independence": 10
        },
        "target_table": "sales",
        "gold_query": "SELECT CAST(sale_at AS DATE) AS sale_date, SUM(quantity * unit_price) AS revenue FROM sales WHERE payment_status = 'completed' GROUP BY 1 ORDER BY 1;",
        "expected_explanation_id": "expl_refunds_and_voids",
        "passing_score": 75
    }'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    briefing = EXCLUDED.briefing,
    rubric_config = EXCLUDED.rubric_config;

-- Synthetic Sales Table for Chapter 1 Evaluation Fixture
CREATE TABLE IF NOT EXISTS ch1_cafe_sales (
    id SERIAL PRIMARY KEY,
    transaction_code VARCHAR(30) NOT NULL,
    sale_at TIMESTAMPTZ NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL, -- 'completed', 'refunded', 'voided'
    payment_method VARCHAR(30) NOT NULL
);

-- Seed Synthetic Café Sales
INSERT INTO ch1_cafe_sales (transaction_code, sale_at, item_name, quantity, unit_price, payment_status, payment_method)
VALUES
    ('TX-1001', '2026-10-01 08:15:00+01', 'Espresso Doppio', 2, 2500.00, 'completed', 'pos_card'),
    ('TX-1002', '2026-10-01 09:30:00+01', 'Club Sandwich Combo', 3, 4500.00, 'completed', 'cash'),
    ('TX-1003', '2026-10-01 10:45:00+01', 'Caramel Macchiato', 4, 3000.00, 'completed', 'transfer'),
    ('TX-1004', '2026-10-01 13:00:00+01', 'Catering Platter Special', 1, 85000.00, 'completed', 'transfer'),
    ('TX-1005', '2026-10-01 15:20:00+01', 'Avocado Toast & Tea', 2, 5000.00, 'refunded', 'pos_card'), -- Refunded!
    ('TX-1006', '2026-10-01 16:40:00+01', 'Accidental Duplicate Order', 5, 6000.00, 'voided', 'pos_card'), -- Voided!
    ('TX-1007', '2026-10-02 08:30:00+01', 'Vanilla Latte', 4, 3000.00, 'completed', 'pos_card'),
    ('TX-1008', '2026-10-02 11:15:00+01', 'Suya Beef Wrap', 6, 4000.00, 'completed', 'transfer'),
    ('TX-1009', '2026-10-02 14:00:00+01', 'Meeting Room Coffee Box', 2, 45000.00, 'completed', 'transfer'),
    ('TX-1010', '2026-10-02 16:30:00+01', 'Gluten Free Pastry Pack', 2, 8000.00, 'voided', 'pos_card'), -- Voided!
    ('TX-1011', '2026-10-03 09:00:00+01', 'Iced Americano', 3, 2250.00, 'completed', 'cash'),
    ('TX-1012', '2026-10-03 12:10:00+01', 'Executive Lunch Basket', 1, 75000.00, 'completed', 'transfer'),
    ('TX-1013', '2026-10-03 14:45:00+01', 'Sparkling Berry Brew', 3, 3166.67, 'completed', 'pos_card'),
    ('TX-1014', '2026-10-03 17:00:00+01', 'Catering Test Order', 2, 25000.00, 'refunded', 'transfer'); -- Refunded!
