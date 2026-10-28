export interface PriceResponse {
  productId: string;
  basePrice: number;
  finalPrice: number;
  discounts: Array<{
    type: string;
    amount: number;
    percentage?: number;
  }>;
  quantity: number;
  totalPrice: number;
}
