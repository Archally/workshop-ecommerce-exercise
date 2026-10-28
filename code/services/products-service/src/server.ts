import cors from 'cors';
import express from 'express';
import { PriceRequest } from './catalog/PriceRequest';
import { PriceResponse } from './catalog/PriceResponse';
import { products } from './catalog/productCatalog';
import { createOpenApiCapture, mountOpenApiCapture } from './openapi-capture';

const app = express();
const PORT = process.env.PORT || 3001;

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

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'products-service',
    timestamp: new Date().toISOString()
  });
});

// Provider states endpoint for Pact verification
app.post('/provider-states', (req, res) => {
  const { state } = req.body;

  console.log(`Setting up provider state: ${state}`);

  res.status(200).json({
    message: `Provider state "${state}" set up successfully`
  });
});

app.get('/products', (req, res) => {
  const activeProducts = products.filter(product => product.isActive);
  res.json(activeProducts);
});

app.get('/products/:id', (req, res) => {
  const { id } = req.params;
  const product = products.find(p => p.id === id && p.isActive);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  res.json(product);
});

app.post('/products/:id/price', (req, res) => {
  const { id } = req.params;
  const { productId, quantity, discounts }: PriceRequest = req.body;
  
  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ 
      error: 'productId and quantity (> 0) are required' 
    });
  }
  
  if (productId !== id) {
    return res.status(400).json({ 
      error: 'productId in body must match URL parameter' 
    });
  }
  
  const product = products.find(p => p.id === id && p.isActive);
  
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  if (product.stock < quantity) {
    return res.status(400).json({ 
      error: 'Insufficient stock',
      available: product.stock,
      requested: quantity
    });
  }
  
  const basePrice = product.price;
  const appliedDiscounts = discounts || [];
  let finalPrice = basePrice;
  
  for (const discount of appliedDiscounts) {
    if (discount.amount) {
      finalPrice -= discount.amount;
    } else if (discount.percentage) {
      const discountAmount = (basePrice * discount.percentage) / 100;
      finalPrice -= discountAmount;
    }
  }
  
  if (quantity >= 10) {
    const bulkDiscountAmount = basePrice * 0.05;
    appliedDiscounts.push({
      type: 'bulk_discount',
      amount: bulkDiscountAmount,
      percentage: 5
    });
    finalPrice -= bulkDiscountAmount;
  }
  
  const totalPrice = finalPrice * quantity;
  
  const priceResponse: PriceResponse = {
    productId: id,
    basePrice,
    finalPrice: Math.round(finalPrice * 100) / 100,
    discounts: appliedDiscounts,
    quantity,
    totalPrice: Math.round(totalPrice * 100) / 100
  };
  
  res.json(priceResponse);
});

// Mount the document endpoint last, once every route above is declared -
// see the note above createOpenApiCapture() and openapi-capture.ts for why.
mountOpenApiCapture(app, '/api-spec/v3', operations, {
  title: 'Products Service (runtime-observed)',
  description:
    'OpenAPI document generated at runtime from observed request/response traffic by this service\'s own openapi-capture middleware (see services/products-service/src/openapi-capture.ts). Nobody typed this by hand. A route this running instance has not been called against will not appear here.'
});

app.listen(PORT, () => {
  console.log(`Products service running on port ${PORT}`);
  console.log(`Runtime OpenAPI document: http://localhost:${PORT}/api-spec/v3`);
});