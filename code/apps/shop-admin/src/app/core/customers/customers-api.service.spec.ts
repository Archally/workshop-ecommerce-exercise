import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CustomersApiService } from './customers-api.service';
import { Customer } from './customer';

describe('CustomersApiService', () => {
  let service: CustomersApiService;
  let httpMock: HttpTestingController;

  const sampleCustomer: Customer = {
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CustomersApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lists customers from GET /customers', () => {
    service.listCustomers().subscribe();

    const request = httpMock.expectOne('http://localhost:3003/customers');
    expect(request.request.method).toBe('GET');
    request.flush([sampleCustomer]);
  });

  it('reads one customer from GET /customers/:id', () => {
    service.getCustomer('customer-1').subscribe();

    const request = httpMock.expectOne('http://localhost:3003/customers/customer-1');
    expect(request.request.method).toBe('GET');
    request.flush(sampleCustomer);
  });

  it('reads discounts from GET /customers/:id/discounts', () => {
    service.getDiscounts('customer-1').subscribe();

    const request = httpMock.expectOne('http://localhost:3003/customers/customer-1/discounts');
    expect(request.request.method).toBe('GET');
    request.flush({ customerId: 'customer-1', discounts: [] });
  });

  it('removes a customer via DELETE /customers/:id', () => {
    service.deleteCustomer('customer-1').subscribe();

    const request = httpMock.expectOne('http://localhost:3003/customers/customer-1');
    expect(request.request.method).toBe('DELETE');
    request.flush(null, { status: 204, statusText: 'No Content' });
  });
});
