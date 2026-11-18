SELECT CAST(sale_at AS DATE) AS sale_date, SUM(quantity * unit_price) AS revenue
FROM sales
WHERE payment_status = 'completed'
GROUP BY 1
