import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URLS } from '../api-config';
import { Customer } from './customer';
import { CustomerDiscountsResponse } from './customer-discounts-response';

/**
 * Talks to customer-service (:3003). Registration (POST /customers) and edits
 * (PUT /customers/:id) are deliberately not called here - customer-service
 * documents that surface as self-service, belonging to the storefront, not
 * this back office. Listing customers and reading their discounts is
 * legitimate back-office work; DELETE is wired in as an operator action, see
 * the README for the reasoning.
 */
@Injectable({ providedIn: 'root' })
export class CustomersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URLS.customers;

  listCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.baseUrl}/customers`);
  }

  getCustomer(customerId: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.baseUrl}/customers/${customerId}`);
  }

  getDiscounts(customerId: string): Observable<CustomerDiscountsResponse> {
    return this.http.get<CustomerDiscountsResponse>(`${this.baseUrl}/customers/${customerId}/discounts`);
  }

  deleteCustomer(customerId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/customers/${customerId}`);
  }
}
