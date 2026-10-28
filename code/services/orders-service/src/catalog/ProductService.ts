import axios from 'axios';
import { Discount } from '../customers/Discount';
import { PriceResponse } from './PriceResponse';
import { Product } from './Product';

const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3001';

export class ProductService {
  async getProductDetails(productId: string): Promise<Product> {
    try {
      const response = await axios.get<Product>(`${PRODUCTS_SERVICE_URL}/products/${productId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error(`Product ${productId} not found`);
      }
      throw new Error(`Failed to fetch product details: ${error}`);
    }
  }

  async getProductPrice(productId: string, quantity: number, discounts?: Discount[]): Promise<PriceResponse> {
    try {
      const response = await axios.post<PriceResponse>(
        `${PRODUCTS_SERVICE_URL}/products/${productId}/price`,
        {
          productId,
          quantity,
          discounts: discounts || []
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Product ${productId} not found`);
        }
        if (error.response?.status === 400) {
          throw new Error(error.response.data.error || 'Invalid request');
        }
      }
      throw new Error(`Failed to fetch product price: ${error}`);
    }
  }

  async checkHealthy(): Promise<boolean> {
    try {
      const response = await axios.get(`${PRODUCTS_SERVICE_URL}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}