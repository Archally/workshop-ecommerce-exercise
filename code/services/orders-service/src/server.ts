import cors from 'cors';
import express from 'express';
import { ProductService } from './catalog/ProductService';
import { Discount } from './customers/Discount';
import { CustomerService } from './customers/CustomerService';
import { createOpenApiCapture, mountOpenApiCapture } from './openapi-capture';
import { CreateOrderRequest } from './orders/CreateOrderRequest';
import { Order } from './orders/Order';
import { OrderItem } from './orders/OrderItem';
import { ORDER_FORWARD_PATH, ORDER_STATUSES, OrderStatus } from './orders/OrderStatus';
import { orders } from './orders/orderStore';

const app = express();
const PORT = process.env.PORT || 3002;
const productService = new ProductService();
const customerService = new CustomerService();

// Serves an OpenAPI 3 document derived from what this running instance has
// actually seen on the wire - not hand-written. See openapi-capture.ts for
// the full design and its blind spots; `capture` has to be wired AFTER
// express.json() below (so req.body/req.query are already populated) and
// BEFORE any route (so it can watch every response), and
// mountOpenApiCapture() has to run LAST, right before app.listen, once
// every route is declared.
const { capture, operations } = createOpenApiCapture();

app.use(cors());
app.use(express.json());
app.use(capture);

// order-1 through order-8 are seeded in orders/orderStore.ts (2026-09-20 seed-data pass);
// the next order minted by this service must not collide with any of them.
let orderIdCounter = 9;

app.get('/health', async (req, res) => {
  const isProductServiceHealthy = await productService.checkHealthy();
  const isCustomerServiceHealthy = await customerService.checkHealthy();
  
  res.status(200).json({ 
    status: 'healthy',
    service: 'orders-service',
    timestamp: new Date().toISOString(),
    dependencies: {
      productsService: isProductServiceHealthy ? 'healthy' : 'unhealthy',
      customerService: isCustomerServiceHealthy ? 'healthy' : 'unhealthy'
    }
  });
});

app.get('/orders', (req, res) => {
  const { customerId } = req.query;
  
  if (customerId) {
    const customerOrders = orders.filter(order => order.customerId === customerId);
    return res.json(customerOrders);
  }
  
  res.json(orders);
});

app.get('/orders/:id', (req, res) => {
  const { id } = req.params;
  const order = orders.find(o => o.id === id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json(order);
});

app.post('/orders', async (req, res) => {
  try {
    const { customerId, items }: CreateOrderRequest = req.body;
    
    if (!customerId || !items || items.length === 0) {
      return res.status(400).json({ 
        error: 'customerId and items are required' 
      });
    }
    
    const orderItems: OrderItem[] = [];
    let totalAmount = 0;
    
    let customerDiscounts: Discount[];
    try {
      console.log(`📋 Implementing bookProductsForOrder story for customer: ${customerId}`);
      console.log(`   Step 1: Retrieving customer discounts from Customer Service...`);
      
      const discountsResponse = await customerService.getCustomerDiscounts(customerId);
      customerDiscounts = discountsResponse.discounts;
      
      console.log(`   ✅ Retrieved ${customerDiscounts.length} discounts for customer ${customerId}`);
    } catch (error) {
      console.warn(`   ⚠️ Could not retrieve customer discounts: ${error}`);
      customerDiscounts = []; // Continue with empty discounts if customer service fails
    }
    
    for (const item of items) {
      const { productId, quantity } = item;
      
      if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({ 
          error: 'Each item must have productId and quantity > 0' 
        });
      }
      
      try {
        console.log(`   Step 2.${orderItems.length + 1}a: Retrieving product details for ${productId}...`);
        
        const productDetails = await productService.getProductDetails(productId);
        console.log(`   ✅ Retrieved product details: ${productDetails.name}`);
        
        console.log(`   Step 2.${orderItems.length + 1}b: Retrieving product price with ${customerDiscounts.length} customer discounts...`);
        
        const priceResponse = await productService.getProductPrice(productId, quantity, customerDiscounts);
        console.log(`   ✅ Retrieved pricing: base $${priceResponse.basePrice} → final $${priceResponse.finalPrice} (total: $${priceResponse.totalPrice})`);
        
        const orderItem: OrderItem = {
          productId,
          productName: productDetails.name,
          quantity,
          unitPrice: priceResponse.finalPrice,
          totalPrice: priceResponse.totalPrice
        };
        
        orderItems.push(orderItem);
        totalAmount += priceResponse.totalPrice;
      } catch (error) {
        console.error(`   ❌ Error processing product ${productId}: ${error}`);
        return res.status(400).json({ 
          error: `Error processing product ${productId}: ${error}` 
        });
      }
    }
    
    console.log(`   🎯 bookProductsForOrder story completed successfully!`);
    console.log(`   📊 Order summary: ${orderItems.length} items, total: $${Math.round(totalAmount * 100) / 100}`);
    
    const newOrder: Order = {
      id: `order-${orderIdCounter++}`,
      customerId,
      items: orderItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    orders.push(newOrder);
    
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * The statuses `current` may legally move to next: the next step on the
 * forward path, plus `cancelled` for as long as the order has not already
 * reached one of the two terminal statuses (`delivered`, `cancelled`).
 * Mirrors the forward-path-plus-cancel rule the Shop Admin order-status
 * control already applies client-side (`ORDER_FORWARD_PATH` in
 * apps/shop-admin/src/app/core/orders/order-status.ts) - this is that same rule enforced
 * server-side, so a direct API call cannot do what the UI already refuses to
 * offer.
 */
function validNextStatuses(current: OrderStatus): OrderStatus[] {
  const next: OrderStatus[] = [];

  const index = ORDER_FORWARD_PATH.indexOf(current);
  if (index !== -1 && index < ORDER_FORWARD_PATH.length - 1) {
    next.push(ORDER_FORWARD_PATH[index + 1]);
  }

  if (current !== 'cancelled' && current !== 'delivered') {
    next.push('cancelled');
  }

  return next;
}

function canTransition(current: OrderStatus, next: OrderStatus): boolean {
  return validNextStatuses(current).includes(next);
}

app.put('/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !ORDER_STATUSES.includes(status)) {
    return res.status(400).json({
      error: 'Valid status is required',
      validStatuses: ORDER_STATUSES
    });
  }

  const orderIndex = orders.findIndex(o => o.id === id);

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const currentStatus = orders[orderIndex].status;

  if (!canTransition(currentStatus, status)) {
    return res.status(400).json({
      error: `Cannot move an order from '${currentStatus}' to '${status}'`,
      from: currentStatus,
      validNextStatuses: validNextStatuses(currentStatus)
    });
  }

  orders[orderIndex].status = status;
  orders[orderIndex].updatedAt = new Date().toISOString();

  res.json(orders[orderIndex]);
});

/**
 * Test-only: the Pact provider-state hook. The route exists only when the service starts with
 * PACT_PROVIDER_STATES=1, and is absent otherwise, so the shop as `make run-all` starts it is
 * unchanged. contract-tests/orders-service/verify.mjs calls it to put the service into the one
 * provider state its interaction names, which no call on the public API can produce: the pact
 * addresses an order by a UUID, and POST /orders assigns its own `order-N` ids.
 *
 * Body: { "state": "<provider state name>", "action": "setup" | "teardown" }.
 * It only ever adds and removes the order it inserted itself; an order it did not insert is
 * never changed. Every state it does not know is refused by name.
 */
if (process.env.PACT_PROVIDER_STATES === '1') {
  // The values the storefront pact carries for Submit Order - success.
  const PACT_SUBMIT_STATE = "an order is ready for submission";
  const PACT_ORDER_ID = '550e8400-e29b-41d4-a716-446655440000';
  const PACT_CUSTOMER_ID = '00000000-0000-0000-0000-000000000000';

  let insertedOrder: Order | null = null;

  const removeInsertedOrder = (): boolean => {
    const index = insertedOrder ? orders.indexOf(insertedOrder) : -1;
    if (index !== -1) orders.splice(index, 1);
    insertedOrder = null;
    return index !== -1;
  };

  app.post('/_pact/provider-states', (req, res) => {
    const { state, action } = req.body ?? {};

    if (state !== PACT_SUBMIT_STATE) {
      return res.status(400).json({
        error: `provider state refused: "${state}" is not a state this hook sets up`,
        known: [PACT_SUBMIT_STATE]
      });
    }

    if (action === 'teardown') {
      return res.json({ state, action, removed: removeInsertedOrder() ? [PACT_ORDER_ID] : [] });
    }

    if (action !== 'setup') {
      return res.status(400).json({ error: `action must be "setup" or "teardown", not "${action}"` });
    }

    removeInsertedOrder();
    if (orders.some(order => order.id === PACT_ORDER_ID)) {
      return res.status(409).json({
        error: `an order ${PACT_ORDER_ID} exists that this hook did not insert; it is left untouched`
      });
    }

    // The pact's own example instant, so every run inserts the same order.
    const createdAt = '2026-01-01T00:00:00.000Z';
    insertedOrder = {
      id: PACT_ORDER_ID,
      customerId: PACT_CUSTOMER_ID,
      items: [
        {
          productId: '1',
          productName: 'Wireless Bluetooth Headphones',
          quantity: 1,
          unitPrice: 179.99,
          totalPrice: 179.99
        }
      ],
      totalAmount: 179.99,
      status: 'pending',
      createdAt,
      updatedAt: createdAt
    };
    orders.push(insertedOrder);

    res.status(201).json({ state, action, inserted: [PACT_ORDER_ID] });
  });

  console.log('Pact provider-state hook enabled: POST /_pact/provider-states (PACT_PROVIDER_STATES=1)');
}



// app.post('/orders/:id/submit', (req, res) => {
//   const { id } = req.params;
//
//   const orderIndex = orders.findIndex(o => o.id === id);
//
//   if (orderIndex === -1) {
//     return res.status(404).json({ error: 'Order not found' });
//   }
//
//   const order = orders[orderIndex];
//
//   if (!order.items || order.items.length === 0) {
//     return res.status(400).json({ error: 'An order with no lines cannot be submitted' });
//   }
//
//   // Marks the moment and publishes Order Submitted . No state change.
//   order.updatedAt = new Date().toISOString();
//
//   res.json(order);
// });



// Mount the document endpoint last, once every route above is declared -
// see the note above createOpenApiCapture() and openapi-capture.ts for why.
mountOpenApiCapture(app, '/api-spec/v3', operations, {
  title: 'Orders Service (runtime-observed)',
  description:
    'OpenAPI document generated at runtime from observed request/response traffic by this service\'s own openapi-capture middleware (see services/orders-service/src/openapi-capture.ts). Nobody typed this by hand. A route this running instance has not been called against will not appear here.'
});

app.listen(PORT, () => {
  console.log(`Orders service running on port ${PORT}`);
  console.log(`Runtime OpenAPI document: http://localhost:${PORT}/api-spec/v3`);
});