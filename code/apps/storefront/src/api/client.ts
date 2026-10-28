import { ApiError } from './ApiError';
import type { Product } from './catalog/Product';
import type { Customer } from './customers/Customer';
import type { CustomerDiscountsResponse } from './customers/CustomerDiscountsResponse';
import type { CustomerDraft } from './customers/CustomerDraft';
import type { CustomerSession } from './customers/CustomerSession';
import type { RegistrationDraft } from './customers/RegistrationDraft';
import type { CreateOrderRequest } from './orders/CreateOrderRequest';
import type { Order } from './orders/Order';

// Base URLs point at the three real services. Override with a .env.local if a
// service is not running on its default port (see apps/storefront/README.md).
const PRODUCTS_URL = import.meta.env.VITE_PRODUCTS_URL ?? 'http://localhost:3001';
const ORDERS_URL = import.meta.env.VITE_ORDERS_URL ?? 'http://localhost:3002';
const CUSTOMERS_URL = import.meta.env.VITE_CUSTOMERS_URL ?? 'http://localhost:3003';

/**
 * The five XML entities Express escapes into its `<pre>` line. Not a general HTML
 * decoder: the only text this ever sees is one path, and a general decoder would be a
 * dependency for five characters.
 */
function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/g, "'")
    .replace(/&amp;/g, '&');
}

async function parseErrorBody(response: Response): Promise<{ message: string; fieldMessages: string[] }> {
  const contentType = response.headers.get('content-type') ?? '';
  const fallback = `${response.status} ${response.statusText}`;

  if (!contentType.includes('application/json')) {
    const text = await response.text().catch(() => '');
    // An HTML error page is not a sentence anybody wants to read. Express's default
    // handler answers an unrouted request with a whole document whose ONLY useful part is
    // the `<pre>` line - `Cannot POST /orders/order-9/submit` - and returning the document
    // verbatim put the doctype, the head and the body into the panel on screen.
    // Measured 2026-09-25 against the orders service with its submit route commented out.
    if (/^\s*<(!doctype|html)/i.test(text)) {
      const pre = /<pre>([\s\S]*?)<\/pre>/i.exec(text);
      return { message: pre ? decodeEntities(pre[1]).trim() : fallback, fieldMessages: [] };
    }
    return { message: text.trim() || fallback, fieldMessages: [] };
  }

  const body = await response.json().catch(() => null);
  if (!body) {
    return { message: fallback, fieldMessages: [] };
  }

  // Node services: { error: string }. ASP.NET [ApiController] auto-validation:
  // { title, errors: { Field: string[] } }. Cover both without assuming one.
  const fieldMessages: string[] = [];
  if (body.errors && typeof body.errors === 'object') {
    for (const messages of Object.values(body.errors)) {
      if (Array.isArray(messages)) {
        fieldMessages.push(...(messages as string[]));
      }
    }
  }

  const message = body.error ?? body.title ?? fallback;
  return { message, fieldMessages };
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers
      }
    });
  } catch {
    throw new ApiError(`Could not reach ${new URL(url).origin}. Is that service running?`, null);
  }

  if (!response.ok) {
    const { message, fieldMessages } = await parseErrorBody(response);
    throw new ApiError(message, response.status, fieldMessages);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const productsApi = {
  list: () => request<Product[]>(`${PRODUCTS_URL}/products`),
  get: (productId: string) => request<Product>(`${PRODUCTS_URL}/products/${productId}`)
};

export const ordersApi = {
  listForCustomer: (customerId: string) =>
    request<Order[]>(`${ORDERS_URL}/orders?customerId=${encodeURIComponent(customerId)}`),
  get: (orderId: string) => request<Order>(`${ORDERS_URL}/orders/${orderId}`),
  create: (order: CreateOrderRequest) =>
    request<Order>(`${ORDERS_URL}/orders`, {
      method: 'POST',
      body: JSON.stringify(order)
    }),
  // Submit Order. The second half of the two-step create-then-submit design:
  // it is what publishes Order Submitted, which is what makes Inventory
  // reserve stock. The order's status is unchanged by it.
  submit: (orderId: string) =>
    request<Order>(`${ORDERS_URL}/orders/${orderId}/submit`, {
      method: 'POST',
      body: JSON.stringify({})
    })
};

export const customersApi = {
  get: (customerId: string) => request<Customer>(`${CUSTOMERS_URL}/customers/${customerId}`),
  discounts: (customerId: string) =>
    request<CustomerDiscountsResponse>(`${CUSTOMERS_URL}/customers/${customerId}/discounts`),
  register: (draft: RegistrationDraft) =>
    request<Customer>(`${CUSTOMERS_URL}/customers`, {
      method: 'POST',
      body: JSON.stringify(draft)
    }),
  update: (customerId: string, draft: CustomerDraft) =>
    request<Customer>(`${CUSTOMERS_URL}/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(draft)
    }),
  signIn: (login: string, password: string) =>
    request<CustomerSession>(`${CUSTOMERS_URL}/customers/sign-in`, {
      method: 'POST',
      body: JSON.stringify({ login, password })
    }),
  // Resolves a remembered token to the customer it belongs to, or rejects with a
  // 401 the caller reads as "signed out".
  session: (token: string) =>
    request<Customer>(`${CUSTOMERS_URL}/customers/session`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  signOut: (token: string) =>
    request<void>(`${CUSTOMERS_URL}/customers/session`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
};
