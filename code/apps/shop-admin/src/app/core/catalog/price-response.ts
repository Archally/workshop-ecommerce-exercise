import { PriceDiscount } from './price-discount';

export interface PriceResponse {
  productId: string;
  basePrice: number;
  finalPrice: number;
  discounts: PriceDiscount[];
  quantity: number;
  totalPrice: number;
}
