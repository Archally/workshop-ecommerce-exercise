export interface CreateOrderRequest {
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
}
