// The entry point scripts/generate-type-schemas.mjs compiles: it reads one file
// and emits a JSON Schema for every type exported from it. Each type lives in
// its own file; this barrel is what gives the generator a single root, and the
// re-export order is the key order of the generated document.
export * from './catalog/Product';
export * from './catalog/PriceResponse';
export * from './orders/OrderItem';
export * from './orders/OrderStatus';
export * from './orders/Order';
export * from './orders/CreateOrderRequest';
export * from './customers/Discount';
export * from './customers/CustomerDiscountsResponse';
export * from './customers/Customer';
