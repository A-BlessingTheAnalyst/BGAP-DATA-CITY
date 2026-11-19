from collections import Counter

successful = Counter()
for row in access_log:
    parts = row['line'].split()
    path, status = parts[3], parts[4]
    if status == '200':
        successful[path] += 1

result = successful.most_common(1)[0][0]
