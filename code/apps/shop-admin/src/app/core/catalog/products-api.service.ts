import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URLS } from '../api-config';
import { PriceRequest } from './price-request';
import { PriceResponse } from './price-response';
import { Product } from './product';

/**
 * Talks to products-service (:3001). Every method here is a request the
 * service actually serves - see services/products-service/src/server.ts. There is no
 * publish-product and no create-category endpoint on that service, so this
 * client offers none either.
 */
@Injectable({ providedIn: 'root' })
export class ProductsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URLS.products;

  listProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseUrl}/products`);
  }

  getProduct(productId: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/products/${productId}`);
  }

  /**
   * Asks the service to price a quantity of this product, with any discount
   * lines the operator supplies. This does NOT change the catalog price -
   * the endpoint computes and returns a quote, it never persists anything
   * (confirmed by reading services/products-service/src/server.ts: the handler never
   * writes back to the product record).
   */
  quotePrice(productId: string, request: PriceRequest): Observable<PriceResponse> {
    return this.http.post<PriceResponse>(`${this.baseUrl}/products/${productId}/price`, request);
  }
}
