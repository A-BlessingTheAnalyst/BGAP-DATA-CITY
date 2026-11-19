SELECT cohort, AVG(best_score) AS avg_best_score
FROM (
  SELECT cadet_id, cohort, MAX(score) AS best_score
  FROM cadet_attempts
  GROUP BY cadet_id, cohort
) AS best_per_cadet
GROUP BY cohort
ORDER BY avg_best_score DESC
LIMIT 1
