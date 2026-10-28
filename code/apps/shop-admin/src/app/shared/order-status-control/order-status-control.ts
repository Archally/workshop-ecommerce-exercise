import { Component, computed, inject, input, output, signal } from '@angular/core';
import { ActivityLogService } from '../../core/activity-log/activity-log.service';
import { toDisplayError } from '../../core/api-config';
import { Order } from '../../core/orders/order';
import { ORDER_FORWARD_PATH, OrderStatus } from '../../core/orders/order-status';
import { OrdersApiService } from '../../core/orders/orders-api.service';

/**
 * The one write orders-service offers, wrapped as a reusable control: an
 * "Advance to <next>" primary action that walks ORDER_FORWARD_PATH one step
 * at a time, plus a "Cancel order" escape hatch - matching DESIGN.md's
 * instruction to constrain the control to the forward path plus cancel,
 * rather than offering an illegal transition and rejecting it after the
 * fact. Lives under shared/ because it is written to be mounted anywhere an
 * order is on screen; today the order detail header is the only mount.
 */
@Component({
  selector: 'app-order-status-control',
  templateUrl: './order-status-control.html',
  styleUrl: './order-status-control.css',
})
export class OrderStatusControl {
  private readonly ordersApi = inject(OrdersApiService);
  private readonly activityLog = inject(ActivityLogService);

  readonly order = input.required<Order>();
  readonly changed = output<Order>();

  protected readonly busy = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly nextStatus = computed<OrderStatus | null>(() => {
    const status = this.order().status;
    const index = ORDER_FORWARD_PATH.indexOf(status);
    if (index === -1 || index === ORDER_FORWARD_PATH.length - 1) {
      return null;
    }
    return ORDER_FORWARD_PATH[index + 1];
  });

  protected readonly canCancel = computed(() => {
    const status = this.order().status;
    return status !== 'cancelled' && status !== 'delivered';
  });

  protected readonly isTerminal = computed(
    () => this.nextStatus() === null && !this.canCancel(),
  );

  protected advance(): void {
    const next = this.nextStatus();
    if (next) {
      this.apply(next);
    }
  }

  protected cancel(): void {
    this.apply('cancelled');
  }

  private apply(status: OrderStatus): void {
    const order = this.order();
    const from = order.status;
    this.busy.set(true);
    this.errorMessage.set(null);

    this.ordersApi.setStatus(order.id, status).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.activityLog.record('transition', `Order ${order.id}:`, { from, to: updated.status });
        this.activityLog.flash(order.id);
        this.changed.emit(updated);
      },
      error: (err: unknown) => {
        this.busy.set(false);
        this.errorMessage.set(toDisplayError(err, 'Could not update this order.'));
      },
    });
  }
}
