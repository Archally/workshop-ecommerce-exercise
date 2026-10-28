import { OrderItem } from './OrderItem';
import { OrderStatus } from './OrderStatus';

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}
