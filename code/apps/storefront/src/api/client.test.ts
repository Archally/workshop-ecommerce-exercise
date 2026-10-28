import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './ApiError';
import { customersApi, productsApi } from './client';

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    ...init
  });
}

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns parsed JSON on a 200', async () => {
    const product = { id: '1', name: 'Widget' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(product)));

    await expect(productsApi.get('1')).resolves.toEqual(product);
  });

  it('turns a JSON { error } body into an ApiError carrying the service message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: 'Product not found' }, { status: 404 }))
    );

    await expect(productsApi.get('missing')).rejects.toMatchObject({
      message: 'Product not found',
      status: 404
    });
  });

  it('flattens ASP.NET [ApiController]\'s { errors } validation body into field messages', async () => {
    // Captured verbatim from a live POST /customers with an empty/invalid
    // body against the running customer-service (.NET), 2026-09-20:
    // curl -X POST http://localhost:3003/customers -d '{"email":"not-an-email", ...blank fields}'
    const validationBody = {
      type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
      title: 'One or more validation errors occurred.',
      status: 400,
      errors: {
        Name: ['The Name field is required.'],
        Email: ['The Email field is not a valid e-mail address.']
      },
      traceId: '00-813cbc45d32badf25d02a5e2287e7c14-12e9fb4b03af26cb-00'
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(validationBody, { status: 400 })));

    const error = await customersApi
      .register({ name: '', email: 'not-an-email', password: '' })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe('One or more validation errors occurred.');
    expect((error as ApiError).fieldMessages).toEqual(
      expect.arrayContaining(['The Name field is required.', 'The Email field is not a valid e-mail address.'])
    );
  });

  it('turns a fetch failure into an unreachable ApiError, never an unhandled rejection', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));

    const error = await productsApi.get('1').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isUnreachable).toBe(true);
  });
});
