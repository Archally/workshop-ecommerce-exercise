/**
 * Two of the model's test cases, run against the running orders service.
 *
 * Each `it` below is one test case in `team design notes/orders/test-cases.yaml`, and asserts that
 * case's own `given`, `when` and `expected_result`, not merely that the route answers:
 *
 *     a confirmed order moved to `shipped` -> 200, the order returned as `shipped`
 *     a delivered order moved to `pending` -> 400, the refusal naming `delivered`
 *
 * The case's `model: Order` is asserted on the fields the model's `Order` and the code's `Order`
 * name the same way (`customerId`, `status`, `createdAt`). The two shapes differ on the rest
 * (`orderId`/`lines` against `id`/`items`), which the model records as finding ``;
 * asserting the model's names here would fail on that finding rather than on the case.
 *
 * ── What this does to the running shop ──────────────────────────────────────────────────────────
 * Every order the cases need is created here, through `POST /orders`, for a customer id no
 * customer holds, and moved only through `PUT /orders/:id/status`. No order that existed before
 * the run is written, and the last check below proves it: every one of them is read back
 * unchanged. The service has no route that removes an order, so the two orders created here stay
 * in its in-memory store until the service next restarts. Saving `services/orders-service/src/server.ts`
 * restarts it (it runs under `node --watch`), which is what the local beat's uncomment and
 * `npm run local:reset` both do.
 *
 * This is NOT part of the recorded local: `local:generate`, `local:test` and `local:reset`
 * never read anything here. Run it with `npm run test:orders-service` from the repository root.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const ORDERS = (process.env.ORDERS_SERVICE_URL || 'http://localhost:3002').replace(/\/$/, '');

// No customer holds this id, so no customer's order history gains an order. The order service
// asks the customer service for this customer's discounts, is told there is no such customer,
// and prices the order with none - its documented behaviour when that lookup fails.
const TEST_CUSTOMER = 'test-case-customer';
// A product the catalog holds, so the order can be priced.
const PRODUCT_ID = '1';

interface Order {
  id: string;
  customerId: string;
  items: unknown[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

async function call(method: string, path: string, body?: unknown) {
  const response = await fetch(`${ORDERS}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, text, json: text ? JSON.parse(text) : undefined };
}

/** A new order of this run's own, moved forward through the service's API to `status`. */
async function orderIn(status: 'confirmed' | 'delivered'): Promise<Order> {
  const created = await call('POST', '/orders', {
    customerId: TEST_CUSTOMER,
    items: [{ productId: PRODUCT_ID, quantity: 1 }],
  });
  expect(created.status, `set-up: creating an order answered ${created.text}`).toBe(201);
  const order = created.json as Order;

  const path = ['confirmed', 'shipped', 'delivered'];
  for (const next of path.slice(0, path.indexOf(status) + 1)) {
    const moved = await call('PUT', `/orders/${order.id}/status`, { status: next });
    expect(moved.status, `set-up: moving ${order.id} to ${next} answered ${moved.text}`).toBe(200);
  }

  const read = await call('GET', `/orders/${order.id}`);
  expect((read.json as Order).status, 'set-up: the given state holds').toBe(status);
  return read.json as Order;
}

let before: Order[] = [];
const created: string[] = [];

beforeAll(async () => {
  let listed;
  try {
    listed = await call('GET', '/orders');
  } catch (error) {
    throw new Error(
      `The orders service is not answering at ${ORDERS} (${(error as Error).message}). `
      + 'Start the shop first: make run-all',
    );
  }
  expect(listed.status).toBe(200);
  before = listed.json as Order[];
});

describe('move an order through its lifecycle, against the running service', () => {
  it('a confirmed order moved to shipped answers 200 and comes back shipped', async () => {
    // given: a confirmed order, being shipped by an operator
    const order = await orderIn('confirmed');
    created.push(order.id);

    // when: the operator asks for `shipped`
    const response = await call('PUT', `/orders/${order.id}/status`, { status: 'shipped' });

    // expected: 200, success, an Order, and the output contains "shipped"
    expect(response.status, response.text).toBe(200);
    expect(response.text).toContain('shipped');
    const returned = response.json as Order;
    expect(returned.id).toBe(order.id);
    expect(returned.status).toBe('shipped');
    expect(returned.customerId).toBe(TEST_CUSTOMER);
    expect(Number.isNaN(Date.parse(returned.createdAt))).toBe(false);
  });

  it('a delivered order moved back to pending answers 400 naming delivered', async () => {
    // given: a delivered order, which is terminal
    const order = await orderIn('delivered');
    created.push(order.id);

    // when: someone asks for `pending`
    const response = await call('PUT', `/orders/${order.id}/status`, { status: 'pending' });

    // expected: 400, failure, and the output contains "delivered"
    expect(response.status, response.text).toBe(400);
    expect(response.text).toContain('delivered');

    // and the refusal is a refusal: the order is still delivered
    const after = await call('GET', `/orders/${order.id}`);
    expect((after.json as Order).status).toBe('delivered');
  });
});

afterAll(async () => {
  // Every order that existed before this run is read back byte for byte, and the only new ones
  // are the ones this run created.
  const listed = await call('GET', '/orders');
  const after = listed.json as Order[];
  const untouched = after.filter((order) => !created.includes(order.id));
  expect(JSON.stringify(untouched)).toBe(JSON.stringify(before));
  console.log(
    `  orders before: ${before.length}, after: ${after.length} `
    + `(${created.length} created by this run: ${created.join(', ') || 'none'}; `
    + 'the service has no route that removes one, so they last until it restarts)',
  );
});
