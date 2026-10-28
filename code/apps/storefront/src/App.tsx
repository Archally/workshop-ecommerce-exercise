import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { customersApi } from './api/client';
import { Layout } from './components/Layout';
import { CustomerProvider, forgetRememberedToken, rememberedToken, useCustomer } from './context/CustomerContext';
import { ToastProvider } from './context/ToastContext';
import { AccountPage } from './pages/AccountPage';
import { BrowsePage } from './pages/BrowsePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductPage } from './pages/ProductPage';
import { RegisterPage } from './pages/RegisterPage';
import { SignInPage } from './pages/SignInPage';

function SessionBootstrap() {
  const { refreshCustomer, finishInitializing } = useCustomer();

  useEffect(() => {
    const token = rememberedToken();
    if (!token) {
      return;
    }
    customersApi
      .session(token)
      .then(refreshCustomer)
      .catch(() => {
        // The remembered token no longer resolves (service restarted, signed out
        // elsewhere) - drop it and fall back to signed-out rather than showing an
        // error on first paint.
        forgetRememberedToken();
      })
      .finally(finishInitializing);
    // Runs once on mount only - it reads localStorage, not the callbacks.
  }, []);

  return null;
}

export function App() {
  return (
    <ToastProvider>
      <CustomerProvider>
        <SessionBootstrap />
        <Layout>
          <Routes>
            <Route path="/" element={<BrowsePage />} />
            <Route path="/products/:productId" element={<ProductPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </CustomerProvider>
    </ToastProvider>
  );
}
