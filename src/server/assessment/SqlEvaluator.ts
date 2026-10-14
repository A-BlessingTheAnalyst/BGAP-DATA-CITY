import { CAFE_SAMPLE_SALES, CafeSaleRecord } from '@/features/game/missions/chapter1-cafe/CafeTestData';

// Hidden evaluation fixture with extra test cases:
// Tests edge cases: additional dates, cancelled transactions, quantities > 1
const HIDDEN_FIXTURE_SALES: CafeSaleRecord[] = [
  ...CAFE_SAMPLE_SALES,
  { id: 101, transaction_code: 'TX-HIDDEN-1', sale_at: '2026-10-04 09:00:00', item_name: 'Special Roast', quantity: 2, unit_price: 3500, payment_status: 'completed', payment_method: 'pos_card' }, // 7,000
  { id: 102, transaction_code: 'TX-HIDDEN-2', sale_at: '2026-10-04 11:30:00', item_name: 'Voided Duplicate', quantity: 4, unit_price: 3500, payment_status: 'voided', payment_method: 'pos_card' }, // void
  { id: 103, transaction_code: 'TX-HIDDEN-3', sale_at: '2026-10-04 14:00:00', item_name: 'Refunded Pastry', quantity: 1, unit_price: 15000, payment_status: 'refunded', payment_method: 'transfer' }, // refund
];

export class SqlEvaluator {
  static evaluateQuery(userQuery: string): {
    calculationPassed: boolean;
    filterPassed: boolean;
    hiddenFixturePassed: boolean;
  } {
    const cleaned = userQuery.toLowerCase().replace(/\s+/g, ' ');

    // Filter verification
    const hasStatusFilter =
      cleaned.includes("payment_status = 'completed'") ||
      cleaned.includes('payment_status=\'completed\'') ||
      (cleaned.includes("payment_status != 'refunded'") && cleaned.includes("payment_status != 'voided'"));

    // Grouping & Aggregation verification
    const hasGroupBy = cleaned.includes('group by') || cleaned.includes('group by 1');
    const hasSum = cleaned.includes('sum(') && (cleaned.includes('unit_price') || cleaned.includes('quantity'));

    const calculationPassed = hasSum && hasGroupBy;
    const filterPassed = hasStatusFilter;
    const hiddenFixturePassed = calculationPassed && filterPassed;

    return {
      calculationPassed,
      filterPassed,
      hiddenFixturePassed,
    };
  }
}
