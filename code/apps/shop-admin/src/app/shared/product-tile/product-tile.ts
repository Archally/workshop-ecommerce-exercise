import { Component, computed, input } from '@angular/core';
import { TileProduct } from './tile-product';

/**
 * Drawn product art - added 2026-09-20 for the 22 September local checks
 * (seed data brief). One hand-drawn line icon per category plus a two-letter
 * monogram, rendered as plain inline SVG from data the page already has
 * (category, name, id) - nothing is fetched, nothing is a photograph, and
 * `imageUrl` itself is never read. The icon paths and category palette here
 * are the Angular twin of apps/storefront/src/components/ProductTile.tsx - same drawing,
 * same category hues, each app's own chrome around it.
 */

interface CategoryArt {
  from: string;
  to: string;
  icon: 'chip' | 'chair' | 'leaf' | 'shirt';
}

const CATEGORY_ART: Record<string, CategoryArt> = {
  Electronics: { from: '#1c2c4a', to: '#3d63ad', icon: 'chip' },
  Furniture: { from: '#3e2c0f', to: '#a5701d', icon: 'chair' },
  'Sports & Outdoors': { from: '#0f3327', to: '#1c8a5f', icon: 'leaf' },
  Clothing: { from: '#2c2049', to: '#6c48ad', icon: 'shirt' },
};

const FALLBACK_ART: CategoryArt = { from: '#242938', to: '#4a5170', icon: 'chip' };

function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  // Prefer words that start with a letter, so a name like "27-inch 4K
  // Monitor" reads "M" rather than the digits "27" and "4K" - a monogram
  // should never look like it is quoting the SKU.
  const letterLedWords = words.filter((word) => /^[a-zA-Z]/.test(word));
  const source = letterLedWords.length > 0 ? letterLedWords : words;
  const letters = source.slice(0, 2).map((word) => word.match(/[a-zA-Z]/)?.[0]?.toUpperCase() ?? '');
  return letters.join('') || '?';
}

@Component({
  selector: 'app-product-tile',
  templateUrl: './product-tile.html',
  styleUrl: './product-tile.css',
})
export class ProductTile {
  readonly product = input.required<TileProduct>();

  protected readonly art = computed(() => CATEGORY_ART[this.product().category] ?? FALLBACK_ART);
  protected readonly initials = computed(() => initialsOf(this.product().name));
  protected readonly gradientId = computed(() => `tile-grad-${this.product().id}`);
}
