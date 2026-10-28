import { Component, input } from '@angular/core';
import { OrderStatus } from '../../core/orders/order-status';

@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.css',
})
export class StatusBadge {
  readonly status = input.required<OrderStatus>();
}
