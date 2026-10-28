import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URLS } from '../api-config';
import { Operator } from './operator';
import { OperatorSession } from './operator-session';

/**
 * Talks to customer-service's /operators surface (:3003) - the same session
 * notion the storefront uses for shoppers, against the operator collection.
 * Creating and editing operators is not called here: this back office signs an
 * operator in, it does not administer the operator list.
 */
@Injectable({ providedIn: 'root' })
export class OperatorsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URLS.customers;

  signIn(login: string, password: string): Observable<OperatorSession> {
    return this.http.post<OperatorSession>(`${this.baseUrl}/operators/sign-in`, { login, password });
  }

  /** Resolves a remembered token to its operator, or fails with 401. */
  session(token: string): Observable<Operator> {
    return this.http.get<Operator>(`${this.baseUrl}/operators/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  signOut(token: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/operators/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
