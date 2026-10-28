import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CustomerProvider, useCustomer } from './CustomerContext';

const STORAGE_KEY = 'storefront.sessionToken';

function Probe() {
  const { customer, initializing } = useCustomer();
  return (
    <div>
      <span data-testid="initializing">{String(initializing)}</span>
      <span data-testid="customer">{customer ? customer.id : 'none'}</span>
    </div>
  );
}

describe('CustomerContext initialization race', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('starts NOT initializing when no session token was remembered', () => {
    render(
      <CustomerProvider>
        <Probe />
      </CustomerProvider>
    );
    expect(screen.getByTestId('initializing')).toHaveTextContent('false');
  });

  it('starts initializing when a session token was remembered from a previous visit', () => {
    window.localStorage.setItem(STORAGE_KEY, 'a-remembered-token');

    render(
      <CustomerProvider>
        <Probe />
      </CustomerProvider>
    );

    // A route guard must see `initializing: true` here and wait rather than
    // treat the still-null customer as "signed out" - this is exactly the
    // window in which a page refresh bounced a returning shopper to the sign-in
    // screen before their remembered session had loaded.
    expect(screen.getByTestId('initializing')).toHaveTextContent('true');
    expect(screen.getByTestId('customer')).toHaveTextContent('none');
  });

  it('finishInitializing flips the flag so a guarded route can proceed', () => {
    window.localStorage.setItem(STORAGE_KEY, 'a-remembered-token');

    function ProbeWithFinish() {
      const { initializing, finishInitializing } = useCustomer();
      return (
        <div>
          <span data-testid="initializing">{String(initializing)}</span>
          <button type="button" onClick={finishInitializing}>
            done
          </button>
        </div>
      );
    }

    render(
      <CustomerProvider>
        <ProbeWithFinish />
      </CustomerProvider>
    );

    expect(screen.getByTestId('initializing')).toHaveTextContent('true');
    act(() => {
      screen.getByRole('button', { name: 'done' }).click();
    });
    expect(screen.getByTestId('initializing')).toHaveTextContent('false');
  });
});
