import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OrderList } from './order-list';
import { ActivityLogService } from '../../../core/activity-log/activity-log.service';
import { Customer } from '../../../core/customers/customer';
import { Order } from '../../../core/orders/order';

describe('OrderList', () => {
  let httpMock: HttpTestingController;

  const customers: Customer[] = [
    {
      id: 'customer-1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '123',
      address: '1 Main St',
      city: 'Anytown',
      state: 'CA',
      zip: '12345',
      country: 'USA',
      isActive: true,
    },
  ];

  const orders: Order[] = [
    {
      id: 'order-1',
      customerId: 'customer-1',
      items: [
        { productId: '1', productName: 'Headphones', quantity: 2, unitPrice: 179.99, totalPrice: 359.98 },
      ],
      totalAmount: 359.98,
      status: 'pending',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('loads orders and resolves the customer name for display', async () => {
    const fixture = TestBed.createComponent(OrderList);
    fixture.detectChanges();

    httpMock.expectOne('http://localhost:3003/customers').flush(customers);
    httpMock.expectOne('http://localhost:3002/orders').flush(orders);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('order-1');
    expect(fixture.nativeElement.textContent).toContain('John Doe');
  });

  it('falls back to the raw customer id when the customer list failed to load', async () => {
    const fixture = TestBed.createComponent(OrderList);
    fixture.detectChanges();

    httpMock.expectOne('http://localhost:3003/customers').error(new ProgressEvent('error'), {
      status: 0,
      statusText: 'Unknown Error',
    });
    httpMock.expectOne('http://localhost:3002/orders').flush(orders);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('customer-1');
  });

  it('refilters by customer via the select, requesting the filtered endpoint', async () => {
    const fixture = TestBed.createComponent(OrderList);
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:3003/customers').flush(customers);
    httpMock.expectOne('http://localhost:3002/orders').flush(orders);
    await fixture.whenStable();
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('.filter') as HTMLSelectElement;
    select.value = 'customer-1';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const request = httpMock.expectOne('http://localhost:3002/orders?customerId=customer-1');
    request.flush(orders);
  });

  it('flashes the row for an order whose status just changed elsewhere', async () => {
    const fixture = TestBed.createComponent(OrderList);
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:3003/customers').flush(customers);
    httpMock.expectOne('http://localhost:3002/orders').flush(orders);
    await fixture.whenStable();
    fixture.detectChanges();

    const log = TestBed.inject(ActivityLogService);
    log.flash('order-1');
    fixture.detectChanges();

    const row = fixture.nativeElement.querySelector('.table__row');
    expect(row.classList.contains('is-flashing')).toBe(true);
  });
});
