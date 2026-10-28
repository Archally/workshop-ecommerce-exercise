import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductsApiService } from '../../../core/catalog/products-api.service';
import { Product } from '../../../core/catalog/product';
import { errorIcon, toDisplayError, toStatusCode } from '../../../core/api-config';
import { ProductTile } from '../../../shared/product-tile/product-tile';

@Component({
  selector: 'app-product-list',
  imports: [RouterLink, CurrencyPipe, FormsModule, ProductTile],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList {
  private readonly productsApi = inject(ProductsApiService);

  protected readonly products = signal<Product[]>([]);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly errorIconGlyph = signal('⚠️');
  protected readonly filterText = signal('');

  protected readonly filteredProducts = computed(() => {
    const filter = this.filterText().trim().toLowerCase();
    const all = this.products();
    if (!filter) {
      return all;
    }
    return all.filter(
      (product) =>
        product.name.toLowerCase().includes(filter) ||
        product.category.toLowerCase().includes(filter) ||
        product.brand.toLowerCase().includes(filter) ||
        product.sku.toLowerCase().includes(filter),
    );
  });

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.productsApi.listProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.errorMessage.set(toDisplayError(err, 'Could not reach products-service on :3001.'));
        this.errorIconGlyph.set(errorIcon(toStatusCode(err)));
        this.loading.set(false);
      },
    });
  }

  protected retry(): void {
    this.load();
  }
}
