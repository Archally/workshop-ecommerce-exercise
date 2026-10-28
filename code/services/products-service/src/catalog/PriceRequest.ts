export interface PriceRequest {
  productId: string;
  quantity: number;
  discounts?: Array<{
    type: string;
    amount: number;
    percentage?: number;
  }>;
}
