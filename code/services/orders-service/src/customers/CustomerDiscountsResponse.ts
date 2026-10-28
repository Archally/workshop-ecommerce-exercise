import { Discount } from './Discount';

export interface CustomerDiscountsResponse {
  customerId: string;
  discounts: Discount[];
}
