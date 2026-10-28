import axios from 'axios';
import { Customer } from './Customer';
import { CustomerDiscountsResponse } from './CustomerDiscountsResponse';

const CUSTOMER_SERVICE_URL = process.env.CUSTOMER_SERVICE_URL || 'http://localhost:3003';

export class CustomerService {
  async getCustomerById(customerId: string): Promise<Customer> {
    try {
      const response = await axios.get<Customer>(`${CUSTOMER_SERVICE_URL}/customers/${customerId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error(`Customer ${customerId} not found`);
      }
      throw new Error(`Failed to fetch customer details: ${error}`);
    }
  }

  async getCustomerDiscounts(customerId: string): Promise<CustomerDiscountsResponse> {
    try {
      const response = await axios.get<CustomerDiscountsResponse>(
        `${CUSTOMER_SERVICE_URL}/customers/${customerId}/discounts`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Customer ${customerId} not found`);
        }
        if (error.response?.status === 400) {
          throw new Error(error.response.data.error || 'Invalid request');
        }
      }
      throw new Error(`Failed to fetch customer discounts: ${error}`);
    }
  }

  async checkHealthy(): Promise<boolean> {
    try {
      const response = await axios.get(`${CUSTOMER_SERVICE_URL}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}
