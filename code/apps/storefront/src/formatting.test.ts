import { describe, expect, it } from 'vitest';
import { formatMoney } from './formatting';

describe('formatMoney', () => {
  it('renders a whole dollar amount with cents', () => {
    expect(formatMoney(199.99)).toBe('$199.99');
  });

  it('rounds a floating-point discount total to two decimals', () => {
    expect(formatMoney(29.735)).toBe('$29.74');
  });

  it('renders zero as a real amount, not a blank', () => {
    expect(formatMoney(0)).toBe('$0.00');
  });
});
