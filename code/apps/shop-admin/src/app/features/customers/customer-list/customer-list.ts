import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { errorIcon, toDisplayError, toStatusCode } from '../../../core/api-config';
import { Customer } from '../../../core/customers/customer';
import { CustomersApiService } from '../../../core/customers/customers-api.service';

@Component({
  selector: 'app-customer-list',
  imports: [RouterLink, FormsModule],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.css',
})
export class CustomerList {
  private readonly customersApi = inject(CustomersApiService);

  protected readonly customers = signal<Customer[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly errorIconGlyph = signal('⚠️');
  protected readonly filterText = signal('');

  protected readonly filteredCustomers = computed(() => {
    const filter = this.filterText().trim().toLowerCase();
    const all = this.customers();
    if (!filter) {
      return all;
    }
    return all.filter(
      (customer) =>
        customer.name.toLowerCase().includes(filter) ||
        customer.email.toLowerCase().includes(filter) ||
        customer.city.toLowerCase().includes(filter),
    );
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.customersApi.listCustomers().subscribe({
      next: (customers) => {
        this.customers.set(customers);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.errorMessage.set(toDisplayError(err, 'Could not reach customer-service on :3003.'));
        this.errorIconGlyph.set(errorIcon(toStatusCode(err)));
        this.loading.set(false);
      },
    });
  }

  protected retry(): void {
    this.load();
  }
}
