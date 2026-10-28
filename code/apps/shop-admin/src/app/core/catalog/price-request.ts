import { PriceDiscount } from './price-discount';

export interface PriceRequest {
  productId: string;
  quantity: number;
  discounts?: PriceDiscount[];
}
