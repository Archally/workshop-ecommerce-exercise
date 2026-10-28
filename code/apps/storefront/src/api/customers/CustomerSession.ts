import type { Customer } from './Customer';

export interface CustomerSession {
  token: string;
  customer: Customer;
}
