import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ordersApi } from '../api/client';
import type { Order } from '../api/orders/Order';
import { ErrorPanel } from '../components/ErrorPanel';
import { LoadingState } from '../components/LoadingState';
import { StatusBadge } from '../components/StatusBadge';
import { useCustomer } from '../context/CustomerContext';
import { formatDate, formatMoney } from '../formatting';
import './OrdersPage.css';

type LoadState = { kind: 'loading' } | { kind: 'error'; error: unknown } | { kind: 'ready'; orders: Order[] };

export function OrdersPage() {
  const { customer, initializing } = useCustomer();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  const load = () => {
    if (!customer) {
      return;
    }
    setState({ kind: 'loading' });
    ordersApi
      .listForCustomer(customer.id)
      .then((orders) => setState({ kind: 'ready', orders: [...orders].reverse() }))
      .catch((error: unknown) => setState({ kind: 'error', error }));
  };

  useEffect(load, [customer]);

  if (initializing) {
    return <LoadingState label="Loading your session..." />;
  }

  if (!customer) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <div>
      <header className="orders-page__header">
        <h1 className="section-title">My orders</h1>
        <p className="section-subtitle">Order history for {customer.name}.</p>
      </header>

      {state.kind === 'loading' && <LoadingState label="Loading orders..." />}
      {state.kind === 'error' && <ErrorPanel error={state.error} onRetry={load} />}
      {state.kind === 'ready' && state.orders.length === 0 && (
        <div className="state-panel">
          <p>No orders yet.</p>
          <Link to="/" className="button button--primary">
            Browse products
          </Link>
        </div>
      )}
      {state.kind === 'ready' && state.orders.length > 0 && (
        <div className="orders-list">
          {state.orders.map((order) => (
            <Link to={`/orders/${order.id}`} key={order.id} className="orders-list__row panel">
              <div>
                <p className="orders-list__id mono">{order.id}</p>
                <p className="orders-list__items">
                  {order.items.map((item) => `${item.quantity} x ${item.productName}`).join(', ')}
                </p>
                <p className="orders-list__date">{formatDate(order.createdAt)}</p>
              </div>
              <div className="orders-list__right">
                <StatusBadge status={order.status} />
                <p className="orders-list__total">{formatMoney(order.totalAmount)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
