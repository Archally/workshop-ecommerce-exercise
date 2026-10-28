export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
];

/** The forward path an order follows when nothing interrupts it: cancelled is reachable from any of these. */
export const ORDER_FORWARD_PATH: readonly OrderStatus[] = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
];
