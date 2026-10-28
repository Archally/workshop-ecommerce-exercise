/**
 * A business-shaped failure: what the service said, not a raw stack trace.
 * `status` lets a page decide "not found" vs "this input was rejected" vs
 * "the service did not answer at all".
 */
export class ApiError extends Error {
  readonly status: number | null;
  readonly fieldMessages: string[];

  constructor(message: string, status: number | null, fieldMessages: string[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldMessages = fieldMessages;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isUnreachable(): boolean {
    return this.status === null;
  }

  /**
   * A 404 because this service has NO ROUTE for that method and path, rather than
   * because the thing asked for does not exist.
   *
   * The two are the same status code and a completely different sentence to a reader:
   * "this order is gone" against "this shop cannot do that yet". Express answers an
   * unrouted request with the literal `Cannot POST /orders/order-9/submit`, which is
   * what this recognises. A resource 404 from any service here answers JSON instead,
   * so the two never collide.
   *
   * Measured 2026-09-25: with `POST /orders/:id/submit` commented out, the storefront
   * rendered the whole Express HTML error page under the heading "Not found", which
   * reads as a broken application rather than as an operation this build does not have.
   */
  get isRouteMissing(): boolean {
    return this.status === 404 && /^Cannot (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) \S+$/.test(this.message.trim());
  }
}
