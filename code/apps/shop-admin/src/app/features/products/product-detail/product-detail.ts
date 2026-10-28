import { CurrencyPipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { errorIcon, toDisplayError, toStatusCode } from '../../../core/api-config';
import { ActivityLogService } from '../../../core/activity-log/activity-log.service';
import { PriceDiscount } from '../../../core/catalog/price-discount';
import { PriceResponse } from '../../../core/catalog/price-response';
import { Product } from '../../../core/catalog/product';
import { ProductsApiService } from '../../../core/catalog/products-api.service';
import { ProductTile } from '../../../shared/product-tile/product-tile';

type DiscountMode = 'none' | 'percentage' | 'amount';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, CurrencyPipe, FormsModule, ProductTile],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css',
})
export class ProductDetail {
  private readonly productsApi = inject(ProductsApiService);
  private readonly activityLog = inject(ActivityLogService);

  readonly id = input.required<string>();

  protected readonly product = signal<Product | null>(null);
  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly errorIconGlyph = signal('⚠️');

  protected readonly editingPrice = signal(false);
  protected readonly quantity = signal(1);
  protected readonly discountMode = signal<DiscountMode>('none');
  protected readonly discountValue = signal(10);
  protected readonly quoteLoading = signal(false);
  protected readonly quoteError = signal<string | null>(null);
  protected readonly quoteResult = signal<PriceResponse | null>(null);
  protected readonly justQuoted = signal(false);

  constructor() {
    effect(() => {
      const productId = this.id();
      this.loadProduct(productId);
    });
  }

  private loadProduct(productId: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.quoteResult.set(null);
    this.editingPrice.set(false);
    this.productsApi.getProduct(productId).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.errorMessage.set(toDisplayError(err, `Product ${productId} could not be loaded.`));
        this.errorIconGlyph.set(errorIcon(toStatusCode(err)));
        this.loading.set(false);
      },
    });
  }

  protected startPriceEdit(): void {
    this.editingPrice.set(true);
    this.quoteResult.set(null);
    this.quoteError.set(null);
  }

  protected cancelPriceEdit(): void {
    this.editingPrice.set(false);
  }

  protected calculatePrice(): void {
    const product = this.product();
    if (!product) {
      return;
    }

    const discounts: PriceDiscount[] = [];
    const mode = this.discountMode();
    const value = this.discountValue();
    if (mode === 'percentage' && value > 0) {
      discounts.push({ type: 'operator_discount', percentage: value });
    } else if (mode === 'amount' && value > 0) {
      discounts.push({ type: 'operator_discount', amount: value });
    }

    this.quoteLoading.set(true);
    this.quoteError.set(null);
    this.quoteResult.set(null);

    this.productsApi
      .quotePrice(product.id, {
        productId: product.id,
        quantity: this.quantity(),
        discounts,
      })
      .subscribe({
        next: (result) => {
          this.quoteResult.set(result);
          this.quoteLoading.set(false);
          this.activityLog.record(
            'info',
            `Priced ${result.quantity} x "${product.name}": ${this.formatMoney(result.basePrice)} base -> ` +
              `${this.formatMoney(result.finalPrice)} each, ${this.formatMoney(result.totalPrice)} total.`,
          );
          this.flashQuote();
        },
        error: (err: unknown) => {
          this.quoteError.set(toDisplayError(err, 'Could not price this quantity.'));
          this.quoteLoading.set(false);
        },
      });
  }

  protected readonly appliesBulkDiscount = () => this.quantity() >= 10;

  private flashQuote(): void {
    this.justQuoted.set(true);
    setTimeout(() => this.justQuoted.set(false), 1200);
  }

  private formatMoney(value: number): string {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(value);
  }
}
