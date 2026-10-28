import type { OrderStatus } from '../api/orders/OrderStatus';
import './StatusStepper.css';

const FORWARD_PATH: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];
const STEP_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

/**
 * The forward path an order takes - pending, confirmed, shipped, delivered -
 * as a row of dots a shopper can read at a glance. `cancelled` is an
 * off-path terminal state: it did not complete the forward path, it left it,
 * so it replaces the stepper with a plain banner instead of drawing a
 * struck-through step (see OrderDetailPage).
 */
export function StatusStepper({ status }: { status: OrderStatus }) {
  const currentIndex = FORWARD_PATH.indexOf(status);

  return (
    <ol className="status-stepper">
      {FORWARD_PATH.map((step, index) => {
        const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'future';
        return (
          <li key={step} className={`status-stepper__step status-stepper__step--${state}`}>
            <span className="status-stepper__dot" aria-hidden="true" />
            <span className="status-stepper__label">{STEP_LABELS[step]}</span>
          </li>
        );
      })}
    </ol>
  );
}
