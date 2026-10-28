import { ProductDimensions } from './product-dimensions';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
  weight: number;
  dimensions: ProductDimensions;
  imageUrl: string;
  brand: string;
  isActive: boolean;
}
