SELECT server, SUM(duration_minutes) AS total_downtime_minutes
FROM outages
GROUP BY server
ORDER BY total_downtime_minutes DESC
LIMIT 1
