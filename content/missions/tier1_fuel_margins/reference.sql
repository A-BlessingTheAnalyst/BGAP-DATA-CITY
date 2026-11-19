SELECT fuel_type, SUM((price_per_litre - cost_per_litre) * litres) AS profit
FROM fuel_sales
GROUP BY fuel_type
ORDER BY profit DESC
LIMIT 1
