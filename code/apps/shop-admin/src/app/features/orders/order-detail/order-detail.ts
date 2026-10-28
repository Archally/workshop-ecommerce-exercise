import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { errorIcon, toDisplayError, toStatusCode } from '../../../core/api-config';
import { Customer } from '../../../core/customers/customer';
import { Order } from '../../../core/orders/order';
import { CustomersApiService } from '../../../core/customers/customers-api.service';
import { OrdersApiService } from '../../../core/orders/orders-api.service';
import { StatusBadge } from '../../../shared/status-badge/status-badge';
import { OrderStatusControl } from '../../../shared/order-status-control/order-status-control';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe, StatusBadge, OrderStatusControl],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css',
})
export class OrderDetail {
  private readonly ordersApi = inject(OrdersApiService);
  private readonly customersApi = inject(CustomersApiService);

  readonly id = input.required<string>();

  protected readonly order = signal<Order | null>(null);
  protected readonly customer = signal<Customer | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly errorIconGlyph = signal('⚠️');
  protected readonly justChanged = signal(false);

  constructor() {
    effect(() => {
      const orderId = this.id();
      this.loadOrder(orderId);
    });
  }

  private loadOrder(orderId: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.customer.set(null);
    this.ordersApi.getOrder(orderId).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
        this.customersApi.getCustomer(order.customerId).subscribe({
          next: (customer) => this.customer.set(customer),
          error: () => {
            // Non-fatal: fall back to the raw customer id in the template.
          },
        });
      },
      error: (err: unknown) => {
        this.errorMessage.set(toDisplayError(err, `Order ${orderId} could not be loaded.`));
        this.errorIconGlyph.set(errorIcon(toStatusCode(err)));
        this.loading.set(false);
      },
    });
  }

  protected onStatusChanged(updated: Order): void {
    this.order.set(updated);
    this.justChanged.set(true);
    setTimeout(() => this.justChanged.set(false), 1200);
  }
}
