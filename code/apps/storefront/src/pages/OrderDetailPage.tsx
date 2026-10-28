import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ordersApi } from '../api/client';
import type { Order } from '../api/orders/Order';
import type { OrderStatus } from '../api/orders/OrderStatus';
import { ErrorPanel } from '../components/ErrorPanel';
import { LoadingState } from '../components/LoadingState';
import { StatusBadge } from '../components/StatusBadge';
import { StatusStepper } from '../components/StatusStepper';
import { SubmitOrderPanel } from '../components/SubmitOrderPanel';
import { formatDate, formatMoney } from '../formatting';
import './OrderDetailPage.css';

type LoadState = { kind: 'loading' } | { kind: 'error'; error: unknown } | { kind: 'ready'; order: Order };

interface NavigationState {
  justPlaced?: boolean;
}

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const justPlaced = (location.state as NavigationState | null)?.justPlaced === true;

  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [justChanged, setJustChanged] = useState(false);
  const lastSeenStatus = useRef<OrderStatus | null>(null);

  const load = () => {
    if (!orderId) {
      return;
    }
    setState({ kind: 'loading' });
    ordersApi
      .get(orderId)
      .then((order) => {
        setState({ kind: 'ready', order });
        if (lastSeenStatus.current !== null && lastSeenStatus.current !== order.status) {
          setJustChanged(true);
          window.setTimeout(() => setJustChanged(false), 650);
        }
        lastSeenStatus.current = order.status;
      })
      .catch((error: unknown) => setState({ kind: 'error', error }));
  };

  useEffect(load, [orderId]);

  if (state.kind === 'loading') {
    return <LoadingState label="Loading order..." />;
  }

  if (state.kind === 'error') {
    return <ErrorPanel error={state.error} onRetry={load} />;
  }

  const { order } = state;
  const cancelled = order.status === 'cancelled';

  return (
    <div className="order-detail">
      {justPlaced && (
        <div className="order-detail__confirmation">
          <span className="order-detail__confirmation-icon">{'\u{2705}'}</span>
          <div>
            <h2>Order placed</h2>
            <p>The order was created and priced by the orders and products services just now.</p>
          </div>
        </div>
      )}

      <div className="panel">
        <header className="order-detail__header">
          <div>
            <p className="order-detail__label">Order</p>
            <h1 className="order-detail__id mono">{order.id}</h1>
          </div>
          <div className="order-detail__header-actions">
            <button type="button" className="button button--ghost button--small" onClick={load}>
              Refresh status
            </button>
            <StatusBadge status={order.status} justChanged={justChanged} />
          </div>
        </header>

        {cancelled ? (
          <div className="order-detail__cancelled-banner">
            This order left the fulfilment path - it will not proceed further.
          </div>
        ) : (
          <StatusStepper status={order.status} />
        )}

        <dl className="kv order-detail__meta">
          <dt>Customer</dt>
          <dd className="mono">{order.customerId}</dd>
          <dt>Placed</dt>
          <dd>{formatDate(order.createdAt)}</dd>
          <dt>Last updated</dt>
          <dd>{formatDate(order.updatedAt)}</dd>
        </dl>

        <hr className="divider" />

        <table className="order-detail__table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit price</th>
              <th>Line total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.productId}>
                <td>{item.productName}</td>
                <td>{item.quantity}</td>
                <td>{formatMoney(item.unitPrice)}</td>
                <td>{formatMoney(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>Total</td>
              <td>{formatMoney(order.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>

        <p className="order-detail__hint">
          Unit prices already reflect any discounts the customer service reported for this customer.
        </p>

        {!cancelled && <SubmitOrderPanel order={order} />}
      </div>

      <Link to="/orders" className="button button--ghost">
        Back to my orders
      </Link>
    </div>
  );
}
