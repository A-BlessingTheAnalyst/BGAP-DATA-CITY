import { QueryResult } from '@/shared/types/analysis';

export class SqlEvaluator {
  static readonly GOLD_QUERY =
    "SELECT CAST(sale_at AS DATE) AS sale_date, SUM(quantity * unit_price) AS revenue FROM sales WHERE payment_status = 'completed' GROUP BY 1 ORDER BY 1;";

  static evaluateQuery(userQuery: string, userResult?: QueryResult) {
    const cleaned = userQuery.toLowerCase().replace(/\s+/g, ' ');

    const hasFilter = cleaned.includes("payment_status = 'completed'") ||
      cleaned.includes('payment_status=\'completed\'') ||
      (cleaned.includes("payment_status != 'refunded'") && cleaned.includes("payment_status != 'voided'"));

    const hasGroupBy = cleaned.includes('group by') && cleaned.includes('order by');
    const hasSum = cleaned.includes('sum(') && (cleaned.includes('unit_price') || cleaned.includes('quantity'));

    return {
      calculationPassed: hasSum && hasGroupBy,
      filterPassed: hasFilter,
    };
  }
}
