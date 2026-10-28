import { OrderStatus } from '../orders/order-status';

/**
 * The from/to of an order status change, kept structured (not baked into the
 * message string) so the feed can render the old status dim/struck and the
 * new one as the same pill component used everywhere else.
 */
export interface StatusTransition {
  from: OrderStatus;
  to: OrderStatus;
}
