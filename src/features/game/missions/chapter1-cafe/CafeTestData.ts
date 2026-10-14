export interface CafeSaleRecord {
  id: number;
  transaction_code: string;
  sale_at: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  payment_status: 'completed' | 'refunded' | 'voided';
  payment_method: string;
}

export const CAFE_SAMPLE_SALES: CafeSaleRecord[] = [
  { id: 1, transaction_code: 'TX-1001', sale_at: '2026-10-01 08:15:00', item_name: 'Espresso Doppio', quantity: 2, unit_price: 2500, payment_status: 'completed', payment_method: 'pos_card' },
  { id: 2, transaction_code: 'TX-1002', sale_at: '2026-10-01 09:30:00', item_name: 'Club Sandwich Combo', quantity: 3, unit_price: 4500, payment_status: 'completed', payment_method: 'cash' },
  { id: 3, transaction_code: 'TX-1003', sale_at: '2026-10-01 10:45:00', item_name: 'Caramel Macchiato', quantity: 4, unit_price: 3000, payment_status: 'completed', payment_method: 'transfer' },
  { id: 4, transaction_code: 'TX-1004', sale_at: '2026-10-01 13:00:00', item_name: 'Catering Platter Special', quantity: 1, unit_price: 85000, payment_status: 'completed', payment_method: 'transfer' },
  { id: 5, transaction_code: 'TX-1005', sale_at: '2026-10-01 15:20:00', item_name: 'Avocado Toast & Tea', quantity: 2, unit_price: 5000, payment_status: 'refunded', payment_method: 'pos_card' },
  { id: 6, transaction_code: 'TX-1006', sale_at: '2026-10-01 16:40:00', item_name: 'Accidental Duplicate Order', quantity: 5, unit_price: 6000, payment_status: 'voided', payment_method: 'pos_card' },
  { id: 7, transaction_code: 'TX-1007', sale_at: '2026-10-02 08:30:00', item_name: 'Vanilla Latte', quantity: 4, unit_price: 3000, payment_status: 'completed', payment_method: 'pos_card' },
  { id: 8, transaction_code: 'TX-1008', sale_at: '2026-10-02 11:15:00', item_name: 'Suya Beef Wrap', quantity: 6, unit_price: 4000, payment_status: 'completed', payment_method: 'transfer' },
  { id: 9, transaction_code: 'TX-1009', sale_at: '2026-10-02 14:00:00', item_name: 'Meeting Room Coffee Box', quantity: 2, unit_price: 45000, payment_status: 'completed', payment_method: 'transfer' },
  { id: 10, transaction_code: 'TX-1010', sale_at: '2026-10-02 16:30:00', item_name: 'Gluten Free Pastry Pack', quantity: 2, unit_price: 8000, payment_status: 'voided', payment_method: 'pos_card' },
  { id: 11, transaction_code: 'TX-1011', sale_at: '2026-10-03 09:00:00', item_name: 'Iced Americano', quantity: 3, unit_price: 2250, payment_status: 'completed', payment_method: 'cash' },
  { id: 12, transaction_code: 'TX-1012', sale_at: '2026-10-03 12:10:00', item_name: 'Executive Lunch Basket', quantity: 1, unit_price: 75000, payment_status: 'completed', payment_method: 'transfer' },
  { id: 13, transaction_code: 'TX-1013', sale_at: '2026-10-03 14:45:00', item_name: 'Sparkling Berry Brew', quantity: 3, unit_price: 3166.67, payment_status: 'completed', payment_method: 'pos_card' },
  { id: 14, transaction_code: 'TX-1014', sale_at: '2026-10-03 17:00:00', item_name: 'Catering Test Order', quantity: 2, unit_price: 25000, payment_status: 'refunded', payment_method: 'transfer' },
];
