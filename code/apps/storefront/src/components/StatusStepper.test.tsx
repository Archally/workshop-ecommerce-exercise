import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusStepper } from './StatusStepper';

describe('StatusStepper', () => {
  it('renders the four forward-path steps for a pending order', () => {
    render(<StatusStepper status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Shipped')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
  });

  it('marks steps before the current one as done and the rest as future', () => {
    render(<StatusStepper status="shipped" />);
    expect(screen.getByText('Pending').closest('li')).toHaveClass('status-stepper__step--done');
    expect(screen.getByText('Confirmed').closest('li')).toHaveClass('status-stepper__step--done');
    expect(screen.getByText('Shipped').closest('li')).toHaveClass('status-stepper__step--current');
    expect(screen.getByText('Delivered').closest('li')).toHaveClass('status-stepper__step--future');
  });
});
