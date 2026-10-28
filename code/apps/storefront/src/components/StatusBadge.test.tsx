import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders a readable label for each order status', () => {
    render(<StatusBadge status="shipped" />);
    expect(screen.getByText('Shipped')).toBeInTheDocument();
  });

  it('carries a status-specific class so color reads at a glance', () => {
    render(<StatusBadge status="cancelled" />);
    expect(screen.getByText('Cancelled')).toHaveClass('badge--cancelled');
  });
});
