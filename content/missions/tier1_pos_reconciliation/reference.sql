SELECT ref, amount
FROM cash_book
WHERE ref NOT IN (SELECT txn_id FROM pos_log WHERE status = 'success')
