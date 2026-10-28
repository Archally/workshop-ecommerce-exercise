import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ordersApi, productsApi } from '../api/client';
import type { Product } from '../api/catalog/Product';
import { ErrorPanel } from '../components/ErrorPanel';
import { LoadingState } from '../components/LoadingState';
import { useCustomer } from '../context/CustomerContext';
import { useToast } from '../context/ToastContext';
import { formatMoney } from '../formatting';
import { ProductTile } from '../components/ProductTile';
import './ProductPage.css';

type LoadState = { kind: 'loading' } | { kind: 'error'; error: unknown } | { kind: 'ready'; product: Product };

export function ProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { customer, initializing } = useCustomer();
  const { showToast } = useToast();

  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [quantity, setQuantity] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<unknown>(null);

  const load = () => {
    if (!productId) {
      return;
    }
    setState({ kind: 'loading' });
    productsApi
      .get(productId)
      .then((product) => setState({ kind: 'ready', product }))
      .catch((error: unknown) => setState({ kind: 'error', error }));
  };

  useEffect(load, [productId]);

  const placeOrder = async () => {
    if (!customer || state.kind !== 'ready' || !productId) {
      return;
    }
    setPlacing(true);
    setPlaceError(null);
    try {
      const order = await ordersApi.create({
        customerId: customer.id,
        items: [{ productId, quantity }]
      });
      showToast(`Order placed - ${order.id}`);
      navigate(`/orders/${order.id}`, { state: { justPlaced: true } });
    } catch (error) {
      setPlaceError(error);
    } finally {
      setPlacing(false);
    }
  };

  if (state.kind === 'loading') {
    return <LoadingState label="Loading product..." />;
  }

  if (state.kind === 'error') {
    return <ErrorPanel error={state.error} onRetry={load} />;
  }

  const { product } = state;
  const outOfStock = product.stock <= 0;
  const quantityTooHigh = quantity > product.stock;

  return (
    <div className="product-page">
      <div className="product-page__gallery">
        <div className="product-page__image-frame">
          <ProductTile product={product} className="product-page__tile" />
          <span className="product-page__category">{product.category}</span>
        </div>
      </div>

      <div className="product-page__details panel">
        {/* The page's own name. The visible h1 below is the product's name, which
            changes with every product, so it cannot identify the screen. */}
        <h2 className="sr-only">Product details</h2>
        <p className="product-page__brand">{product.brand}</p>
        <h1 className="product-page__name">{product.name}</h1>
        <p className="product-page__description">{product.description}</p>

        <div className="product-page__price-row">
          <span className="product-page__price">{formatMoney(product.price)}</span>
          <span className={outOfStock ? 'product-page__stock product-page__stock--empty' : 'product-page__stock'}>
            {outOfStock ? 'Out of stock' : `${product.stock} in stock`}
          </span>
        </div>

        <hr className="divider" />

        <dl className="kv">
          <dt>SKU</dt>
          <dd className="mono">{product.sku}</dd>
          <dt>Weight</dt>
          <dd>{product.weight} kg</dd>
          <dt>Dimensions</dt>
          <dd>
            {product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} cm
          </dd>
        </dl>

        <hr className="divider" />

        {initializing && (
          <p className="product-page__hint">Checking your session...</p>
        )}

        {!initializing && !customer && (
          <div className="product-page__signin-prompt">
            <p>Sign in to place an order.</p>
            <Link to="/sign-in" className="button button--primary">
              Sign in
            </Link>
            <Link to="/register" className="button button--ghost">
              Register
            </Link>
          </div>
        )}

        {customer && !outOfStock && (
          <div className="product-page__order">
            <div className="field">
              <label htmlFor="quantity">Quantity</label>
              <input
                id="quantity"
                type="number"
                min={1}
                max={product.stock}
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
              />
            </div>
            <button
              type="button"
              className="button button--primary button--block"
              disabled={placing || quantityTooHigh}
              onClick={placeOrder}
            >
              {placing ? 'Placing order...' : `Place order - ${formatMoney(product.price * quantity)}`}
            </button>
            {quantityTooHigh && (
              <p className="product-page__hint">Only {product.stock} available.</p>
            )}
            <p className="product-page__hint">
              Ordering as <strong>{customer.name}</strong>. Discounts on file, if any, are applied
              automatically by the orders service.
            </p>
          </div>
        )}

        {customer && outOfStock && <p className="product-page__hint">This product cannot be ordered right now.</p>}

        {placeError ? <ErrorPanel error={placeError} /> : null}
      </div>
    </div>
  );
}
