import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/ApiError';
import { ErrorPanel } from './ErrorPanel';

describe('ErrorPanel', () => {
  it('reads an unreachable service as a connectivity event, not a stack trace', () => {
    render(<ErrorPanel error={new ApiError('Could not reach http://localhost:3001. Is that service running?', null)} />);
    expect(screen.getByText('Service unavailable')).toBeInTheDocument();
  });

  it('reads a 404 as "not found"', () => {
    render(<ErrorPanel error={new ApiError('Product not found', 404)} />);
    expect(screen.getByText('Not found')).toBeInTheDocument();
    expect(screen.getByText('Product not found')).toBeInTheDocument();
  });

  it('lists field-level messages from a rejected 400', () => {
    render(<ErrorPanel error={new ApiError('Validation failed', 400, ['Email is required'])} />);
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('offers "Try again" for an unreachable service', () => {
    render(<ErrorPanel error={new ApiError('Could not reach it', null)} onRetry={() => {}} />);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('does not offer "Try again" for a 404 - retrying resolves nothing', () => {
    render(<ErrorPanel error={new ApiError('Product not found', 404)} onRetry={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('does not offer "Try again" for a rejected 400 - the input needs to change, not the request', () => {
    render(<ErrorPanel error={new ApiError('Validation failed', 400, ['Email is required'])} onRetry={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });
});

describe('a 404 that is a missing ROUTE, not a missing thing', () => {
  // Reported from the live shop 2026-09-25: pressing Submit order with
  // `POST /orders/:id/submit` commented out rendered the whole Express HTML error
  // document under the heading "Not found". The body was 160 bytes of doctype, head
  // and a `<pre>`, and it reads as a broken application rather than as an operation
  // this build does not have.
  const EXPRESS_BODY = 'Cannot POST /orders/order-9/submit';

  it('names the gap instead of suggesting the order is missing', () => {
    render(<ErrorPanel error={new ApiError(EXPRESS_BODY, 404)} />);
    expect(screen.getByText('This shop cannot do that yet')).toBeTruthy();
    expect(screen.queryByText('Not found')).toBeNull();
  });

  it('does not offer a retry, because retrying resolves nothing', () => {
    const onRetry = vi.fn();
    render(<ErrorPanel error={new ApiError(EXPRESS_BODY, 404)} onRetry={onRetry} />);
    expect(screen.queryByText('Try again')).toBeNull();
  });

  it('leaves a RESOURCE 404 alone, which is the same status and a different sentence', () => {
    render(<ErrorPanel error={new ApiError('Order not found', 404)} />);
    expect(screen.getByText('Not found')).toBeTruthy();
    expect(screen.getByText('Order not found')).toBeTruthy();
    expect(screen.queryByText('This shop cannot do that yet')).toBeNull();
  });

  it('leaves an unreachable service alone, and it stays retryable', () => {
    const onRetry = vi.fn();
    render(
      <ErrorPanel
        error={new ApiError('Could not reach http://localhost:3002. Is that service running?', null)}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText('Service unavailable')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
  });
});
