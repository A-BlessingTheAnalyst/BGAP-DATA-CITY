SELECT branch, SUM(CASE WHEN status = 'defaulted' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) AS default_rate
FROM loans
GROUP BY branch
ORDER BY default_rate DESC
LIMIT 1
