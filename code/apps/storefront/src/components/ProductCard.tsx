import { Link } from 'react-router-dom';
import type { Product } from '../api/catalog/Product';
import { formatMoney } from '../formatting';
import { ProductTile } from './ProductTile';
import './ProductCard.css';

export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock <= 0;

  return (
    // Without an explicit name this link is announced as the run-together text
    // of everything inside it - brand, name, price - which names one product
    // rather than the act. The label keeps all three and says what the link does.
    <Link
      to={`/products/${product.id}`}
      className="product-card"
      aria-label={`Open product: ${product.brand} ${product.name}, ${formatMoney(product.price)}`}
    >
      <div className="product-card__media">
        <ProductTile product={product} className="product-card__tile" />
        <span className="product-card__category">{product.category}</span>
        {outOfStock && <span className="product-card__stock-flag">Out of stock</span>}
      </div>
      <div className="product-card__body">
        <p className="product-card__brand">{product.brand}</p>
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__price">{formatMoney(product.price)}</p>
      </div>
    </Link>
  );
}
