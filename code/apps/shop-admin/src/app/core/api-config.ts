/**
 * Base URLs for the three services this back office reads and writes.
 * Each one matches the default port the service listens on when started
 * with the commands in apps/shop-admin/README.md - see each service's own
 * README/server.ts for the default.
 */
export const API_BASE_URLS = {
  products: 'http://localhost:3001',
  orders: 'http://localhost:3002',
  customers: 'http://localhost:3003',
} as const;

/**
 * Pulls a human-readable message out of an HTTP error body. The three
 * services do not agree on a shape:
 *   - products-service / orders-service return { error: string }
 *   - customer-service returns the message as a bare JSON string
 * so this reads whichever shape actually came back rather than assuming one.
 */
export function extractErrorMessage(errorBody: unknown, fallback: string): string {
  if (typeof errorBody === 'string' && errorBody.trim().length > 0) {
    return errorBody;
  }
  if (
    errorBody &&
    typeof errorBody === 'object' &&
    'error' in errorBody &&
    typeof (errorBody as { error: unknown }).error === 'string'
  ) {
    return (errorBody as { error: string }).error;
  }
  return fallback;
}

/**
 * Reads the response body off an Angular HttpErrorResponse-shaped failure and
 * extracts a display message from it. Used at every call site that surfaces
 * an HTTP failure to the operator, so the { error } vs bare-string vs
 * connection-failure cases are handled the same way everywhere.
 */
export function toDisplayError(httpError: unknown, fallback: string): string {
  if (
    httpError &&
    typeof httpError === 'object' &&
    'error' in httpError
  ) {
    return extractErrorMessage((httpError as { error: unknown }).error, fallback);
  }
  return fallback;
}

/**
 * Reads the HTTP status off an HttpErrorResponse-shaped failure. Status 0
 * means the request never reached a server (the service is down).
 */
export function toStatusCode(httpError: unknown): number {
  if (
    httpError &&
    typeof httpError === 'object' &&
    'status' in httpError &&
    typeof (httpError as { status: unknown }).status === 'number'
  ) {
    return (httpError as { status: number }).status;
  }
  return 0;
}

/**
 * The three failure icons used everywhere a request can fail, per the shared
 * plain-unicode vocabulary - no icon font, no SVG set, in either app.
 */
export function errorIcon(status: number): string {
  if (status === 0) {
    return '\u{1F50C}'; // unreachable
  }
  if (status === 404) {
    return '\u{1F50D}'; // not found
  }
  return '⚠️'; // rejected
}
