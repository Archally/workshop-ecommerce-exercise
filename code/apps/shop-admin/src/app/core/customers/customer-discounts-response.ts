import { CustomerDiscount } from './customer-discount';

export interface CustomerDiscountsResponse {
  customerId: string;
  discounts: CustomerDiscount[];
}
