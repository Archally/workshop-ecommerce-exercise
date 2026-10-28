import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProductDetail } from './product-detail';
import { Product } from '../../../core/catalog/product';

describe('ProductDetail', () => {
  let httpMock: HttpTestingController;

  const product: Product = {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones',
    category: 'Electronics',
    price: 199.99,
    stock: 45,
    sku: 'WBH-001',
    weight: 0.25,
    dimensions: { length: 20, width: 18, height: 8 },
    imageUrl: '',
    brand: 'AudioTech',
    isActive: true,
  };

  function createWithId(id: string) {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(ProductDetail);
    fixture.componentRef.setInput('id', id);
    return fixture;
  }

  it('loads and renders the product', async () => {
    const fixture = createWithId('1');
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:3001/products/1').flush(product);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Wireless Bluetooth Headphones');
    expect(fixture.nativeElement.textContent).toContain('WBH-001');
  });

  it('opens the price quote form and computes a quote without touching the catalog price', async () => {
    const fixture = createWithId('1');
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:3001/products/1').flush(product);
    await fixture.whenStable();
    fixture.detectChanges();

    const editButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find((btn) =>
      (btn as HTMLButtonElement).textContent?.includes('Price a quantity'),
    ) as HTMLButtonElement;
    editButton.click();
    fixture.detectChanges();

    const quantityInput = fixture.nativeElement.querySelector('#quantity') as HTMLInputElement;
    quantityInput.value = '10';
    quantityInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const calculateButton = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (btn) => (btn as HTMLButtonElement).textContent?.includes('Calculate price'),
    ) as HTMLButtonElement;
    calculateButton.click();

    const request = httpMock.expectOne('http://localhost:3001/products/1/price');
    expect(request.request.body).toEqual({ productId: '1', quantity: 10, discounts: [] });
    request.flush({
      productId: '1',
      basePrice: 199.99,
      finalPrice: 189.99,
      discounts: [{ type: 'bulk_discount', amount: 10, percentage: 5 }],
      quantity: 10,
      totalPrice: 1899.9,
    });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('bulk_discount');
    expect(fixture.nativeElement.textContent).toContain('$1,899.90');
    // the catalog price shown before entering edit mode is unaffected - no second GET was made
    httpMock.expectNone('http://localhost:3001/products/1');
  });

  it('shows a 404 with the not-found icon when the product id does not exist', async () => {
    const fixture = createWithId('does-not-exist');
    fixture.detectChanges();
    httpMock
      .expectOne('http://localhost:3001/products/does-not-exist')
      .flush({ error: 'Product not found' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Product not found');
    expect(fixture.nativeElement.textContent).toContain('\u{1F50D}');
  });
});
