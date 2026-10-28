import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProductsApiService } from './products-api.service';
import { Product } from './product';

describe('ProductsApiService', () => {
  let service: ProductsApiService;
  let httpMock: HttpTestingController;

  const sampleProduct: Product = {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones',
    category: 'Electronics',
    price: 199.99,
    stock: 45,
    sku: 'WBH-001',
    weight: 0.25,
    dimensions: { length: 20, width: 18, height: 8 },
    imageUrl: 'https://example.com/images/headphones.jpg',
    brand: 'AudioTech',
    isActive: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('lists products from GET /products', () => {
    let result: Product[] | undefined;
    service.listProducts().subscribe((products) => (result = products));

    const request = httpMock.expectOne('http://localhost:3001/products');
    expect(request.request.method).toBe('GET');
    request.flush([sampleProduct]);

    expect(result).toEqual([sampleProduct]);
  });

  it('reads one product from GET /products/:id', () => {
    let result: Product | undefined;
    service.getProduct('1').subscribe((product) => (result = product));

    const request = httpMock.expectOne('http://localhost:3001/products/1');
    expect(request.request.method).toBe('GET');
    request.flush(sampleProduct);

    expect(result).toEqual(sampleProduct);
  });

  it('quotes a price via POST /products/:id/price with the request body sent verbatim', () => {
    service
      .quotePrice('1', { productId: '1', quantity: 10, discounts: [] })
      .subscribe();

    const request = httpMock.expectOne('http://localhost:3001/products/1/price');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ productId: '1', quantity: 10, discounts: [] });
    request.flush({
      productId: '1',
      basePrice: 199.99,
      finalPrice: 189.99,
      discounts: [{ type: 'bulk_discount', amount: 10, percentage: 5 }],
      quantity: 10,
      totalPrice: 1899.9,
    });
  });
});
