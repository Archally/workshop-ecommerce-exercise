import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CustomerDetail } from './customer-detail';
import { ActivityLogService } from '../../../core/activity-log/activity-log.service';
import { Customer } from '../../../core/customers/customer';

describe('CustomerDetail', () => {
  let httpMock: HttpTestingController;

  const customer: Customer = {
    id: 'customer-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '123-456-7890',
    address: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip: '12345',
    country: 'USA',
    isActive: true,
  };

  function createWithId(id: string) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(CustomerDetail);
    fixture.componentRef.setInput('id', id);
    return fixture;
  }

  it('loads the customer and their discounts as chips', async () => {
    const fixture = createWithId('customer-1');
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:3003/customers/customer-1').flush(customer);
    await fixture.whenStable();
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:3003/customers/customer-1/discounts').flush({
      customerId: 'customer-1',
      discounts: [
        { type: 'loyalty', amount: 5, percentage: 10, description: 'Loyalty discount' },
      ],
    });
    await fixture.whenStable();
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.chip--discount');
    expect(chip?.textContent).toContain('loyalty');
    expect(chip?.textContent).toContain('10%');
  });

  it('requires a confirm step before removing, then deletes and navigates back to the list', async () => {
    const fixture = createWithId('customer-1');
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:3003/customers/customer-1').flush(customer);
    await fixture.whenStable();
    fixture.detectChanges();
    httpMock
      .expectOne('http://localhost:3003/customers/customer-1/discounts')
      .flush({ customerId: 'customer-1', discounts: [] });
    await fixture.whenStable();
    fixture.detectChanges();

    // no DELETE fired yet
    httpMock.expectNone('http://localhost:3003/customers/customer-1');

    const removeButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (btn) => (btn as HTMLButtonElement).textContent?.includes('Remove John Doe'),
    ) as HTMLButtonElement;
    removeButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('cannot be undone');

    const confirmButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (btn) => (btn as HTMLButtonElement).textContent?.includes('Yes, remove this customer'),
    ) as HTMLButtonElement;
    confirmButton.click();

    const router = TestBed.inject(Router);
    const navigateSpy = vi.fn();
    router.navigateByUrl = navigateSpy as unknown as typeof router.navigateByUrl;

    const request = httpMock.expectOne('http://localhost:3003/customers/customer-1');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    const log = TestBed.inject(ActivityLogService);
    expect(log.recent()[0].kind).toBe('removal');
    expect(log.recent()[0].message).toContain('John Doe');
    expect(navigateSpy).toHaveBeenCalledWith('/customers');
  });
});
