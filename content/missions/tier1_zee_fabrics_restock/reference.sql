SELECT fabric, SUM(yards * price_per_yard) AS revenue
FROM sales
GROUP BY fabric
ORDER BY revenue DESC
LIMIT 3
