import { Order } from './Order';

export const orders: Order[] = [
  {
    id: 'order-1',
    customerId: 'customer-1',
    items: [
      {
        productId: '1',
        productName: 'Wireless Bluetooth Headphones',
        quantity: 2,
        unitPrice: 179.99,
        totalPrice: 359.98
      }
    ],
    totalAmount: 359.98,
    status: 'confirmed',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'order-2',
    customerId: 'customer-2',
    items: [
      {
        productId: '3',
        productName: 'Stainless Steel Water Bottle',
        quantity: 1,
        unitPrice: 29.74,
        totalPrice: 29.74
      },
      {
        productId: '4',
        productName: 'Organic Cotton T-Shirt',
        quantity: 3,
        unitPrice: 21.24,
        totalPrice: 63.72
      }
    ],
    totalAmount: 93.46,
    status: 'shipped',
    createdAt: '2024-01-14T14:20:00Z',
    updatedAt: '2024-01-15T09:15:00Z'
  },
  // order-3 through order-8 added 2026-09-20 for the 22 September architect
  // local (seed data brief): a history that spreads across every status the
  // service enforces (pending -> confirmed -> shipped -> delivered, plus
  // cancelled reachable off the first three), using the new customer-4
  // (standing discount) and customer-5 (no standing discount) alongside the
  // original three. order-1 and order-2 are left untouched on purpose -
  // services/orders-service/scripts/seed-and-capture-openapi.mjs asserts their exact
  // starting statuses ('confirmed' and 'shipped').
  {
    id: 'order-3',
    customerId: 'customer-2',
    items: [
      {
        productId: '7',
        productName: '27-inch 4K Monitor',
        quantity: 1,
        unitPrice: 421.50,
        totalPrice: 421.50
      }
    ],
    totalAmount: 421.50,
    status: 'pending',
    createdAt: '2026-09-18T08:15:00Z',
    updatedAt: '2026-09-18T08:15:00Z'
  },
  {
    id: 'order-4',
    customerId: 'customer-4',
    items: [
      {
        productId: '6',
        productName: 'Mechanical Keyboard RGB',
        quantity: 2,
        unitPrice: 80.99,
        totalPrice: 161.98
      }
    ],
    totalAmount: 161.98,
    status: 'delivered',
    createdAt: '2026-09-05T11:00:00Z',
    updatedAt: '2026-09-10T09:30:00Z'
  },
  {
    id: 'order-5',
    customerId: 'customer-5',
    items: [
      {
        productId: '6',
        productName: 'Mechanical Keyboard RGB',
        quantity: 1,
        unitPrice: 89.99,
        totalPrice: 89.99
      }
    ],
    totalAmount: 89.99,
    status: 'cancelled',
    createdAt: '2026-09-12T14:22:00Z',
    updatedAt: '2026-09-12T16:00:00Z'
  },
  {
    id: 'order-6',
    customerId: 'customer-1',
    items: [
      {
        productId: '9',
        productName: 'Premium Yoga Mat',
        quantity: 4,
        unitPrice: 24.99,
        totalPrice: 99.96
      }
    ],
    totalAmount: 99.96,
    status: 'confirmed',
    createdAt: '2026-09-15T10:00:00Z',
    updatedAt: '2026-09-15T10:40:00Z'
  },
  {
    id: 'order-7',
    customerId: 'customer-2',
    items: [
      {
        productId: '10',
        productName: 'Tech Hoodie Unisex',
        quantity: 2,
        unitPrice: 47.49,
        totalPrice: 94.98
      }
    ],
    totalAmount: 94.98,
    status: 'shipped',
    createdAt: '2026-09-08T09:00:00Z',
    updatedAt: '2026-09-11T13:00:00Z'
  },
  {
    id: 'order-8',
    customerId: 'customer-4',
    items: [
      {
        productId: '8',
        productName: 'Adjustable Standing Desk',
        quantity: 1,
        unitPrice: 590.00,
        totalPrice: 590.00
      }
    ],
    totalAmount: 590.00,
    status: 'pending',
    createdAt: '2026-09-19T07:45:00Z',
    updatedAt: '2026-09-19T07:45:00Z'
  }
];

// Kept in sync with server.ts's own counter (the one actually used to mint
// new order ids) purely so this file does not read as stale next to the 8
// seeded orders above - see the note at that declaration.
let orderIdCounter = 9;