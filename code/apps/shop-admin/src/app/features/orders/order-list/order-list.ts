import { CurrencyPipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { errorIcon, toDisplayError, toStatusCode } from '../../../core/api-config';
import { ActivityLogService } from '../../../core/activity-log/activity-log.service';
import { Customer } from '../../../core/customers/customer';
import { Order } from '../../../core/orders/order';
import { CustomersApiService } from '../../../core/customers/customers-api.service';
import { OrdersApiService } from '../../../core/orders/orders-api.service';
import { StatusBadge } from '../../../shared/status-badge/status-badge';

@Component({
  selector: 'app-order-list',
  imports: [RouterLink, CurrencyPipe, FormsModule, StatusBadge],
  templateUrl: './order-list.html',
  styleUrl: './order-list.css',
})
export class OrderList {
  private readonly ordersApi = inject(OrdersApiService);
  private readonly customersApi = inject(CustomersApiService);
  private readonly activityLog = inject(ActivityLogService);

  protected readonly orders = signal<Order[]>([]);
  protected readonly customersById = signal<Map<string, Customer>>(new Map());
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly errorIconGlyph = signal('⚠️');

  protected readonly customerFilter = signal('');
  protected readonly flashingOrderId = signal<string | null>(null);

  protected readonly customerOptions = computed(() =>
    Array.from(this.customersById().values()).sort((a, b) => a.name.localeCompare(b.name)),
  );

  constructor() {
    this.loadCustomers();
    this.load();

    // Reinforces the transition narrated in the Activity Feed: if this list
    // is on screen when a status change lands (e.g. the operator navigated
    // back from the order they just advanced), flash that row too.
    effect(() => {
      const change = this.activityLog.lastChange();
      if (!change) {
        return;
      }
      if (this.orders().some((order) => order.id === change.entityId)) {
        this.flashingOrderId.set(change.entityId);
        setTimeout(() => this.flashingOrderId.set(null), 1200);
      }
    });
  }

  protected customerName(customerId: string): string {
    return this.customersById().get(customerId)?.name ?? customerId;
  }

  private loadCustomers(): void {
    this.customersApi.listCustomers().subscribe({
      next: (customers) => {
        this.customersById.set(new Map(customers.map((customer) => [customer.id, customer])));
      },
      error: () => {
        // Non-fatal: the list still works with raw customer ids.
      },
    });
  }

  protected load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    const filter = this.customerFilter();
    this.ordersApi.listOrders(filter || undefined).subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.errorMessage.set(toDisplayError(err, 'Could not reach orders-service on :3002.'));
        this.errorIconGlyph.set(errorIcon(toStatusCode(err)));
        this.loading.set(false);
      },
    });
  }

  protected onCustomerFilterChange(value: string): void {
    this.customerFilter.set(value);
    this.load();
  }

  protected retry(): void {
    this.load();
  }
}
