export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

/** The path an order follows when nothing interrupts it: cancelled is reachable from any of these. */
export const ORDER_FORWARD_PATH: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];
