import { useState } from 'react';
import { ordersApi } from '../api/client';
import type { Order } from '../api/orders/Order';
import { ErrorPanel } from './ErrorPanel';

interface SubmitOrderPanelProps {
  order: Order;
}

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'submitted' }
  | { kind: 'error'; error: unknown };

/**
 * Submit Order, from the shopper's side.
 *
 * Creating an order and submitting it are two operations in this shop, and only
 * the second one publishes Order Submitted. This is the only control in the
 * whole storefront that reaches POST /orders/:id/submit.
 */
export function SubmitOrderPanel(_props: SubmitOrderPanelProps) {


  const { order } = _props;
  const [state, setState] = useState<SubmitState>({ kind: 'idle' });

  const submit = async () => {
    setState({ kind: 'submitting' });
    try {
      await ordersApi.submit(order.id);
      setState({ kind: 'submitted' });
    } catch (error) {
      setState({ kind: 'error', error });
    }
  };

  if (state.kind === 'submitted') {
    return (
      <div className="order-detail__confirmation">
        <span className="order-detail__confirmation-icon">{'\u{1F4E6}'}</span>
        <div>
          <h2>Order submitted</h2>
          <p>The orders service accepted the submission and published Order Submitted.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        className="button button--primary button--block"
        disabled={state.kind === 'submitting'}
        onClick={submit}
      >
        {state.kind === 'submitting' ? 'Submitting...' : 'Submit order'}
      </button>
      <p className="order-detail__hint">
        Placing the order created it. Submitting it is the separate step that tells the rest of the
        shop to act on it.
      </p>
      {state.kind === 'error' ? <ErrorPanel error={state.error} /> : null}
    </div>
  );



  // Reached only while the block above is commented out. The shop renders, the
  // order renders, and the operation has no control.
  return null;
}
