SELECT s.name, s.term_fee - COALESCE(SUM(CASE WHEN p.status = 'confirmed' THEN p.amount END), 0) AS balance
FROM students s
LEFT JOIN payments p ON p.student_id = s.student_id
GROUP BY s.student_id, s.name, s.term_fee
HAVING s.term_fee - COALESCE(SUM(CASE WHEN p.status = 'confirmed' THEN p.amount END), 0) > 0
