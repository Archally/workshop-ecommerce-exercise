import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerProvider } from '../context/CustomerContext';
import { RegisterPage } from './RegisterPage';

const CUSTOMER = {
  id: 'customer-9',
  name: 'Ada Newcomer',
  email: 'ada.newcomer@example.com',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  isActive: true
};

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    ...init
  });
}

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <CustomerProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/account" element={<p>Account page</p>} />
        </Routes>
      </CustomerProvider>
    </MemoryRouter>
  );
}

function fill(name: string, login: string, password: string) {
  fireEvent.change(screen.getByLabelText('Full name'), { target: { value: name } });
  fireEvent.change(screen.getByLabelText('Login'), { target: { value: login } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Register' }));
}

describe('RegisterPage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it('sends exactly the name, login and password it collected - no fabricated fields', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(CUSTOMER, { status: 201 }))
      .mockResolvedValueOnce(jsonResponse({ token: 'a-live-token', customer: CUSTOMER }));
    vi.stubGlobal('fetch', fetchMock);

    renderRegister();
    fill('Ada Newcomer', 'ada.newcomer@example.com', 'newcomer-pass-2026');

    await waitFor(() => expect(screen.getByText('Account page')).toBeInTheDocument());

    const [registerUrl, registerInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(registerUrl).toBe('http://localhost:3003/customers');
    const body = JSON.parse(String(registerInit.body)) as Record<string, unknown>;

    // The payload has three keys, and none of them is a placeholder value the
    // shopper never typed. Registration collects what it collects and sends it.
    expect(Object.keys(body).sort()).toEqual(['email', 'name', 'password']);
    expect(body).toEqual({
      name: 'Ada Newcomer',
      email: 'ada.newcomer@example.com',
      password: 'newcomer-pass-2026'
    });

    // Registering then signing in is what produces the session.
    const [signInUrl] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(signInUrl).toBe('http://localhost:3003/customers/sign-in');
  });

  it('refuses a password shorter than the service will accept, without calling the service', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderRegister();
    fill('Ada Newcomer', 'ada.newcomer@example.com', 'short');

    expect(screen.getByRole('alert')).toHaveTextContent('at least 8 characters');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
