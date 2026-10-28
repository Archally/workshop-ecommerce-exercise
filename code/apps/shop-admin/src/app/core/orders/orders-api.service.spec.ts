import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OrdersApiService } from './orders-api.service';
import { Order } from './order';

describe('OrdersApiService', () => {
  let service: OrdersApiService;
  let httpMock: HttpTestingController;

  const sampleOrder: Order = {
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OrdersApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lists every order from GET /orders when no customer is given', () => {
    service.listOrders().subscribe();

    const request = httpMock.expectOne('http://localhost:3002/orders');
    expect(request.request.method).toBe('GET');
    request.flush([sampleOrder]);
  });

  it('filters by customerId as a query parameter', () => {
    service.listOrders('customer-1').subscribe();

    const request = httpMock.expectOne('http://localhost:3002/orders?customerId=customer-1');
    expect(request.request.method).toBe('GET');
    request.flush([sampleOrder]);
  });

  it('reads one order from GET /orders/:id', () => {
    service.getOrder('order-1').subscribe();

    const request = httpMock.expectOne('http://localhost:3002/orders/order-1');
    expect(request.request.method).toBe('GET');
    request.flush(sampleOrder);
  });

  it('moves an order to the next status via PUT /orders/:id/status', () => {
    service.setStatus('order-1', 'confirmed').subscribe();

    const request = httpMock.expectOne('http://localhost:3002/orders/order-1/status');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ status: 'confirmed' });
    request.flush({ ...sampleOrder, status: 'confirmed' });
  });
});
