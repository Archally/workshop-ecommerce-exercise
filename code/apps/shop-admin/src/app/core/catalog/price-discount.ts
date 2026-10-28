/** A discount line as the products-service price endpoint accepts and returns it. */
export interface PriceDiscount {
  type: string;
  amount?: number;
  percentage?: number;
}
