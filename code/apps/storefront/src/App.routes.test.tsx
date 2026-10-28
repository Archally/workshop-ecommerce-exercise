import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

const TOKEN_KEY = 'storefront.sessionToken';

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    ...init
  });
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

describe('storefront routes closed to a visitor who is not signed in', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
  });

  it.each(['/account', '/orders'])('sends a signed-out visitor at %s to the sign-in screen', async (path) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])));

    renderAt(path);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    );
    expect(screen.getByLabelText('Login')).toBeInTheDocument();
  });

  it('holds a visitor carrying a remembered token on the page until the token has been resolved', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'a-remembered-token');
    // The token is never resolved, so the guard must still be waiting: a guard
    // that read the not-yet-loaded customer as "signed out" would bounce a
    // returning shopper to the sign-in screen on every refresh.
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => undefined)));

    renderAt('/account');

    expect(screen.getByText('Loading your session...')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sign in' })).not.toBeInTheDocument();
  });

  it('drops a remembered token the service refuses, and shows the sign-in screen', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'a-revoked-token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: 'No live customer session' }, { status: 401 }))
    );

    renderAt('/account');

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    );
    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});
