import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CustomerList } from './customer-list';
import { Customer } from '../../../core/customers/customer';

describe('CustomerList', () => {
  let httpMock: HttpTestingController;

  const customers: Customer[] = [
    {
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
    },
    {
      id: 'customer-2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '098-765-4321',
      address: '456 Oak Ave',
      city: 'Another City',
      state: 'NY',
      zip: '54321',
      country: 'USA',
      isActive: true,
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('loads and renders every customer', async () => {
    const fixture = TestBed.createComponent(CustomerList);
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:3003/customers').flush(customers);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.table__row').length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('John Doe');
    expect(fixture.nativeElement.textContent).toContain('Jane Smith');
  });

  it('filters client-side by name, email or city', async () => {
    const fixture = TestBed.createComponent(CustomerList);
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:3003/customers').flush(customers);
    await fixture.whenStable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.filter') as HTMLInputElement;
    input.value = 'jane';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.table__row').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Jane Smith');
  });
});
