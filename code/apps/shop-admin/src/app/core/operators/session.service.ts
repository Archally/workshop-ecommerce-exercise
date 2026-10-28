import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { Operator } from './operator';
import { OperatorsApiService } from './operators-api.service';

const STORAGE_KEY = 'shop-admin.sessionToken';

/**
 * The signed-in operator, for the whole back office. The same session notion the
 * storefront uses: the browser keeps only the opaque token customer-service
 * issued, under this app's own key, and the operator behind it is re-read from
 * the service on the first navigation - so a revoked token resolves to nobody.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly api = inject(OperatorsApiService);

  private readonly token = signal<string | null>(readToken());
  private readonly currentOperator = signal<Operator | null>(null);

  /**
   * True while a remembered token has not yet been resolved. The guard must wait
   * on this rather than read the still-null operator as "signed out", or a page
   * refresh bounces a signed-in operator to the sign-in screen.
   */
  private readonly resolving = signal(readToken() !== null);

  readonly operator = computed(() => this.currentOperator());
  readonly signedIn = computed(() => this.currentOperator() !== null);
  readonly initializing = computed(() => this.resolving());

  signIn(login: string, password: string): Observable<Operator> {
    return this.api.signIn(login, password).pipe(
      tap((session) => {
        window.localStorage.setItem(STORAGE_KEY, session.token);
        this.token.set(session.token);
        this.currentOperator.set(session.operator);
        this.resolving.set(false);
      }),
      // The caller wants the operator; the token is this service's business.
      map((session) => session.operator),
    );
  }

  /** Resolve a remembered token once, on the first guarded navigation. */
  restore(): Observable<Operator> | null {
    const remembered = this.token();
    if (!remembered || this.currentOperator() !== null) {
      this.resolving.set(false);
      return null;
    }
    return this.api.session(remembered).pipe(
      tap({
        next: (operator) => {
          this.currentOperator.set(operator);
          this.resolving.set(false);
        },
        error: () => {
          this.forget();
          this.resolving.set(false);
        },
      }),
    );
  }

  signOut(): void {
    const revoking = this.token();
    this.forget();
    if (revoking) {
      // The screen is already signed out; a failed revoke must not undo that.
      this.api.signOut(revoking).subscribe({ error: () => undefined });
    }
  }

  private forget(): void {
    window.localStorage.removeItem(STORAGE_KEY);
    this.token.set(null);
    this.currentOperator.set(null);
  }
}

function readToken(): string | null {
  return window.localStorage.getItem(STORAGE_KEY);
}
