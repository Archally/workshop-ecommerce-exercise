import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URLS } from '../api-config';
import { Order } from './order';
import { OrderStatus } from './order-status';

/**
 * Talks to orders-service (:3002). Order creation (POST /orders) is left out
 * on purpose: it calls products-service twice per item and is the storefront's
 * checkout flow, not a back-office action.
 */
@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URLS.orders;

  listOrders(customerId?: string): Observable<Order[]> {
    if (customerId) {
      return this.http.get<Order[]>(`${this.baseUrl}/orders`, {
        params: { customerId },
      });
    }
    return this.http.get<Order[]>(`${this.baseUrl}/orders`);
  }

  getOrder(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/orders/${orderId}`);
  }

  /** The one write orders-service offers. */
  setStatus(orderId: string, status: OrderStatus): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}/orders/${orderId}/status`, { status });
  }
}
