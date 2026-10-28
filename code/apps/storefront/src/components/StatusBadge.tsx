import type { OrderStatus } from '../api/orders/OrderStatus';

const LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

interface StatusBadgeProps {
  status: OrderStatus;
  /** Briefly pulses the badge - used when a refresh reveals a status change. */
  justChanged?: boolean;
}

export function StatusBadge({ status, justChanged = false }: StatusBadgeProps) {
  const className = justChanged ? `badge badge--${status} badge--pulse` : `badge badge--${status}`;
  return <span className={className}>{LABELS[status]}</span>;
}
