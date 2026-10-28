import { Routes } from '@angular/router';
import { operatorGuard } from './core/operators/operator-guard';

// Every route but the sign-in screen carries operatorGuard: an unauthenticated
// visitor reaching one is sent to /sign-in rather than shown a back office.
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'products' },
  {
    path: 'sign-in',
    loadComponent: () => import('./features/sign-in/sign-in').then((m) => m.SignIn),
  },
  {
    path: 'products',
    canActivate: [operatorGuard],
    loadComponent: () =>
      import('./features/products/product-list/product-list').then((m) => m.ProductList),
  },
  {
    path: 'products/:id',
    canActivate: [operatorGuard],
    loadComponent: () =>
      import('./features/products/product-detail/product-detail').then((m) => m.ProductDetail),
  },
  {
    path: 'orders',
    canActivate: [operatorGuard],
    loadComponent: () => import('./features/orders/order-list/order-list').then((m) => m.OrderList),
  },
  {
    path: 'orders/:id',
    canActivate: [operatorGuard],
    loadComponent: () =>
      import('./features/orders/order-detail/order-detail').then((m) => m.OrderDetail),
  },
  {
    path: 'customers',
    canActivate: [operatorGuard],
    loadComponent: () =>
      import('./features/customers/customer-list/customer-list').then((m) => m.CustomerList),
  },
  {
    path: 'customers/:id',
    canActivate: [operatorGuard],
    loadComponent: () =>
      import('./features/customers/customer-detail/customer-detail').then(
        (m) => m.CustomerDetail,
      ),
  },
  {
    path: '**',
    canActivate: [operatorGuard],
    loadComponent: () => import('./shared/not-found/not-found').then((m) => m.NotFound),
  },
];
