SELECT keke_id, SUM(cost) * 1.0 / SUM(distance_km) AS cost_per_km
FROM keke_log
WHERE category = 'fuel' AND distance_km IS NOT NULL
GROUP BY keke_id
ORDER BY cost_per_km DESC
LIMIT 1
