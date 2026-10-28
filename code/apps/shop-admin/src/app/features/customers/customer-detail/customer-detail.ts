import { Component, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { errorIcon, toDisplayError, toStatusCode } from '../../../core/api-config';
import { ActivityLogService } from '../../../core/activity-log/activity-log.service';
import { Customer } from '../../../core/customers/customer';
import { CustomerDiscount } from '../../../core/customers/customer-discount';
import { CustomersApiService } from '../../../core/customers/customers-api.service';

@Component({
  selector: 'app-customer-detail',
  imports: [RouterLink],
  templateUrl: './customer-detail.html',
  styleUrl: './customer-detail.css',
})
export class CustomerDetail {
  private readonly customersApi = inject(CustomersApiService);
  private readonly activityLog = inject(ActivityLogService);
  private readonly router = inject(Router);

  readonly id = input.required<string>();

  protected readonly customer = signal<Customer | null>(null);
  protected readonly discounts = signal<CustomerDiscount[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly errorIconGlyph = signal('⚠️');

  protected readonly confirmingRemoval = signal(false);
  protected readonly removing = signal(false);
  protected readonly removeError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const customerId = this.id();
      this.loadCustomer(customerId);
    });
  }

  private loadCustomer(customerId: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.confirmingRemoval.set(false);
    this.removeError.set(null);

    this.customersApi.getCustomer(customerId).subscribe({
      next: (customer) => {
        this.customer.set(customer);
        this.loading.set(false);
        this.customersApi.getDiscounts(customerId).subscribe({
          next: (response) => this.discounts.set(response.discounts),
          error: () => this.discounts.set([]),
        });
      },
      error: (err: unknown) => {
        this.errorMessage.set(toDisplayError(err, `Customer ${customerId} could not be loaded.`));
        this.errorIconGlyph.set(errorIcon(toStatusCode(err)));
        this.loading.set(false);
      },
    });
  }

  protected askToRemove(): void {
    this.confirmingRemoval.set(true);
    this.removeError.set(null);
  }

  protected cancelRemoval(): void {
    this.confirmingRemoval.set(false);
  }

  protected confirmRemoval(): void {
    const customer = this.customer();
    if (!customer) {
      return;
    }
    this.removing.set(true);
    this.removeError.set(null);

    this.customersApi.deleteCustomer(customer.id).subscribe({
      next: () => {
        this.activityLog.record('removal', `Customer ${customer.name} (${customer.id}) removed.`);
        this.router.navigateByUrl('/customers');
      },
      error: (err: unknown) => {
        this.removing.set(false);
        this.removeError.set(toDisplayError(err, 'Could not remove this customer.'));
      },
    });
  }
}
