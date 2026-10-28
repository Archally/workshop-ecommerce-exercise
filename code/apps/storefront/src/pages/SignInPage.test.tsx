import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerProvider } from '../context/CustomerContext';
import { SignInPage } from './SignInPage';

const TOKEN_KEY = 'storefront.sessionToken';

const CUSTOMER = {
  id: 'customer-1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '123-456-7890',
  address: '123 Main St',
  city: 'Anytown',
  state: 'CA',
  zip: '12345',
  country: 'USA',
  isActive: true
};

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    ...init
  });
}

function renderSignIn() {
  return render(
    <MemoryRouter initialEntries={['/sign-in']}>
      <CustomerProvider>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/account" element={<p>Account page</p>} />
        </Routes>
      </CustomerProvider>
    </MemoryRouter>
  );
}

function submit(login: string, password: string) {
  fireEvent.change(screen.getByLabelText('Login'), { target: { value: login } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('SignInPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it('signs a shopper in, remembers the token and lands on the account page', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ token: 'a-live-token', customer: CUSTOMER }));
    vi.stubGlobal('fetch', fetchMock);

    renderSignIn();
    submit('john.doe@example.com', 'shopper-demo-2026');

    await waitFor(() => expect(screen.getByText('Account page')).toBeInTheDocument());

    expect(window.localStorage.getItem(TOKEN_KEY)).toBe('a-live-token');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3003/customers/sign-in');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({
      login: 'john.doe@example.com',
      password: 'shopper-demo-2026'
    });
  });

  it('a refused sign-in says so, remembers nothing, and never names which half was wrong', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ error: 'Login or password is incorrect' }, { status: 401 })
      )
    );

    renderSignIn();
    submit('john.doe@example.com', 'wrong-pass-2026');

    const refusal = await screen.findByRole('alert');
    expect(refusal).toHaveTextContent('Login or password is incorrect.');
    expect(refusal.textContent).not.toMatch(/login is unknown|no such|password is wrong/i);

    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(screen.queryByText('Account page')).not.toBeInTheDocument();
  });
});
