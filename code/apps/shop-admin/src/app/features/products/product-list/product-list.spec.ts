import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProductList } from './product-list';
import { Product } from '../../../core/catalog/product';

describe('ProductList', () => {
  let httpMock: HttpTestingController;

  const products: Product[] = [
    {
      id: '1',
      name: 'Wireless Bluetooth Headphones',
      description: 'desc',
      category: 'Electronics',
      price: 199.99,
      stock: 45,
      sku: 'WBH-001',
      weight: 0.25,
      dimensions: { length: 20, width: 18, height: 8 },
      imageUrl: '',
      brand: 'AudioTech',
      isActive: true,
    },
    {
      id: '2',
      name: 'Ergonomic Office Chair',
      description: 'desc',
      category: 'Furniture',
      price: 349.99,
      stock: 12,
      sku: 'EOC-002',
      weight: 15.5,
      dimensions: { length: 65, width: 65, height: 120 },
      imageUrl: '',
      brand: 'ComfortSeating',
      isActive: true,
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('loads and renders every product from products-service', async () => {
    const fixture = TestBed.createComponent(ProductList);
    fixture.detectChanges();

    httpMock.expectOne('http://localhost:3001/products').flush(products);
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.table__row');
    expect(rows.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Wireless Bluetooth Headphones');
    expect(fixture.nativeElement.textContent).toContain('Ergonomic Office Chair');
  });

  it('filters client-side by name, category, brand or SKU', async () => {
    const fixture = TestBed.createComponent(ProductList);
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:3001/products').flush(products);
    await fixture.whenStable();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.filter') as HTMLInputElement;
    input.value = 'chair';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.table__row');
    expect(rows.length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Ergonomic Office Chair');
    expect(fixture.nativeElement.textContent).not.toContain('Wireless Bluetooth Headphones');
  });

  it('shows a retry affordance when the service cannot be reached', async () => {
    const fixture = TestBed.createComponent(ProductList);
    fixture.detectChanges();

    httpMock.expectOne('http://localhost:3001/products').error(new ProgressEvent('error'), {
      status: 0,
      statusText: 'Unknown Error',
    });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Could not reach products-service');
    const retryButton = fixture.nativeElement.querySelector('.state--error button');
    expect(retryButton).toBeTruthy();

    retryButton.click();
    httpMock.expectOne('http://localhost:3001/products').flush(products);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.table__row').length).toBe(2);
  });
});
