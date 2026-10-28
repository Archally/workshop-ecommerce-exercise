export interface CustomerDiscount {
  type: string;
  amount: number;
  percentage?: number | null;
  description?: string | null;
}
