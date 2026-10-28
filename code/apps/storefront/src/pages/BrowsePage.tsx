import { useEffect, useState } from 'react';
import { productsApi } from '../api/client';
import type { Product } from '../api/catalog/Product';
import { ErrorPanel } from '../components/ErrorPanel';
import { LoadingState } from '../components/LoadingState';
import { ProductCard } from '../components/ProductCard';
import './BrowsePage.css';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; error: unknown }
  | { kind: 'ready'; products: Product[] };

export function BrowsePage() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  const load = () => {
    setState({ kind: 'loading' });
    productsApi
      .list()
      .then((products) => setState({ kind: 'ready', products }))
      .catch((error: unknown) => setState({ kind: 'error', error }));
  };

  useEffect(load, []);

  return (
    <div>
      <header className="browse-header">
        <h1 className="section-title">Shop the catalog</h1>
        <p className="section-subtitle">Everything currently for sale, straight from the products service.</p>
      </header>

      {state.kind === 'loading' && <LoadingState label="Loading products..." />}
      {state.kind === 'error' && <ErrorPanel error={state.error} onRetry={load} />}
      {state.kind === 'ready' && (
        <div className="browse-grid">
          {state.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
