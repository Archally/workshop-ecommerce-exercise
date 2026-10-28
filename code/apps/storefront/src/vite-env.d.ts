/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PRODUCTS_URL?: string;
  readonly VITE_ORDERS_URL?: string;
  readonly VITE_CUSTOMERS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
