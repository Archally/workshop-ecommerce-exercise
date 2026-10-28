import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { customersApi } from '../api/client';
import type { Customer } from '../api/customers/Customer';
import type { CustomerSession } from '../api/customers/CustomerSession';

const STORAGE_KEY = 'storefront.sessionToken';

// The session is the opaque token customer-service issues at sign-in; what the
// browser remembers is that token and nothing else, so the customer behind it is
// re-read from the service on every load and a revoked token resolves to nobody.
// Shop Admin remembers an operator token the same way, under its own key.
interface CustomerContextValue {
  customer: Customer | null;
  /**
   * True only while a remembered token is still being resolved against
   * GET /customers/session on first load. A route that requires a signed-in
   * customer (AccountPage, OrdersPage) must wait for this to go false before
   * treating a null customer as "not signed in" - otherwise a page refresh
   * bounces a returning shopper to the sign-in screen for the instant before
   * their remembered session has had time to load.
   */
  initializing: boolean;
  /** Take a token and a customer straight from a successful sign-in */
  adoptSession: (session: CustomerSession) => void;
  /** Replace the known customer without touching the session, after a profile save */
  refreshCustomer: (customer: Customer) => void;
  finishInitializing: () => void;
  signOut: () => void;
}

const CustomerContext = createContext<CustomerContextValue | null>(null);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomerState] = useState<Customer | null>(null);
  const [token, setToken] = useState<string | null>(() => rememberedToken());
  const [initializing, setInitializing] = useState<boolean>(() => rememberedToken() !== null);

  const adoptSession = useCallback((session: CustomerSession) => {
    window.localStorage.setItem(STORAGE_KEY, session.token);
    setToken(session.token);
    setCustomerState(session.customer);
  }, []);

  const refreshCustomer = useCallback((next: Customer) => setCustomerState(next), []);

  const finishInitializing = useCallback(() => setInitializing(false), []);

  const signOut = useCallback(() => {
    const revoking = token;
    window.localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setCustomerState(null);
    if (revoking) {
      // The screen is already signed out; a failed revoke must not undo that.
      customersApi.signOut(revoking).catch(() => undefined);
    }
  }, [token]);

  const value = useMemo(
    () => ({ customer, initializing, adoptSession, refreshCustomer, finishInitializing, signOut }),
    [customer, initializing, adoptSession, refreshCustomer, finishInitializing, signOut]
  );

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomer(): CustomerContextValue {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}

export function rememberedToken(): string | null {
  return window.localStorage.getItem(STORAGE_KEY);
}

export function forgetRememberedToken(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
