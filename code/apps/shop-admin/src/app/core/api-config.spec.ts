import { errorIcon, extractErrorMessage, toDisplayError, toStatusCode } from './api-config';

describe('extractErrorMessage', () => {
  it('returns a bare string error body as-is (customer-service shape)', () => {
    expect(extractErrorMessage("Customer with ID 'x' not found", 'fallback')).toBe(
      "Customer with ID 'x' not found",
    );
  });

  it('reads the error field from an { error } object (products/orders shape)', () => {
    expect(extractErrorMessage({ error: 'Product not found' }, 'fallback')).toBe(
      'Product not found',
    );
  });

  it('falls back when the body is empty', () => {
    expect(extractErrorMessage(null, 'fallback')).toBe('fallback');
    expect(extractErrorMessage(undefined, 'fallback')).toBe('fallback');
    expect(extractErrorMessage('', 'fallback')).toBe('fallback');
  });

  it('falls back when the body is an unrecognised shape', () => {
    expect(extractErrorMessage({ unexpected: true }, 'fallback')).toBe('fallback');
    expect(extractErrorMessage(42, 'fallback')).toBe('fallback');
  });
});

describe('toDisplayError', () => {
  it('unwraps the .error field off an HttpErrorResponse-shaped failure', () => {
    expect(toDisplayError({ error: { error: 'Product not found' } }, 'fallback')).toBe(
      'Product not found',
    );
  });

  it('unwraps a bare-string .error field (customer-service shape)', () => {
    expect(toDisplayError({ error: "Customer with ID 'x' not found" }, 'fallback')).toBe(
      "Customer with ID 'x' not found",
    );
  });

  it('falls back on a connection failure, where .error is not a body at all', () => {
    expect(toDisplayError({ error: new ProgressEvent('error') }, 'fallback')).toBe('fallback');
  });

  it('falls back when the input is not HttpErrorResponse-shaped', () => {
    expect(toDisplayError(new Error('boom'), 'fallback')).toBe('fallback');
    expect(toDisplayError(null, 'fallback')).toBe('fallback');
  });
});

describe('toStatusCode', () => {
  it('reads the numeric status field', () => {
    expect(toStatusCode({ status: 404 })).toBe(404);
  });

  it('defaults to 0 when there is no status field', () => {
    expect(toStatusCode(null)).toBe(0);
    expect(toStatusCode({})).toBe(0);
  });
});

describe('errorIcon', () => {
  it('picks the unreachable icon for status 0', () => {
    expect(errorIcon(0)).toBe('\u{1F50C}');
  });

  it('picks the not-found icon for 404', () => {
    expect(errorIcon(404)).toBe('\u{1F50D}');
  });

  it('picks the rejected icon for any other status', () => {
    expect(errorIcon(400)).toBe('⚠️');
    expect(errorIcon(500)).toBe('⚠️');
  });
});
