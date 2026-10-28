import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OrderDetail } from './order-detail';
import { Customer } from '../../../core/customers/customer';
import { Order } from '../../../core/orders/order';

describe('OrderDetail', () => {
  let httpMock: HttpTestingController;

  const order: Order = {
    id: 'order-1',
    customerId: 'customer-1',
    items: [
      { productId: '1', productName: 'Headphones', quantity: 2, unitPrice: 179.99, totalPrice: 359.98 },
    ],
    totalAmount: 359.98,
    status: 'pending',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const customer: Customer = {
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
  };

  function createWithId(id: string) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(OrderDetail);
    fixture.componentRef.setInput('id', id);
    return fixture;
  }

  it('loads the order and its customer, and renders the items', async () => {
    const fixture = createWithId('order-1');
    fixture.detectChanges();

    httpMock.expectOne('http://localhost:3002/orders/order-1').flush(order);
    await fixture.whenStable();
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:3003/customers/customer-1').flush(customer);
    await fixture.whenStable();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('order-1');
    expect(text).toContain('John Doe');
    expect(text).toContain('Headphones');
  });

  it('advancing the status updates the header pill and flashes it', async () => {
    const fixture = createWithId('order-1');
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:3002/orders/order-1').flush(order);
    await fixture.whenStable();
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:3003/customers/customer-1').flush(customer);
    await fixture.whenStable();
    fixture.detectChanges();

    const advanceButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (btn) => (btn as HTMLButtonElement).textContent?.includes('Advance to confirmed'),
    ) as HTMLButtonElement;
    advanceButton.click();

    httpMock
      .expectOne('http://localhost:3002/orders/order-1/status')
      .flush({ ...order, status: 'confirmed' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.status-block')?.textContent?.trim()).toBe(
      'confirmed',
    );
    expect(fixture.nativeElement.querySelector('.status-block.is-flashing')).toBeTruthy();
  });
});
