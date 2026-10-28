import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCustomer } from '../context/CustomerContext';
import './Layout.css';

export function Layout({ children }: { children: ReactNode }) {
  const { customer, signOut } = useCustomer();

  return (
    <div className="layout">
      <header className="layout__header">
        <Link to="/" className="layout__brand">
          <span className="layout__brand-mark" aria-hidden="true">
            {'\u{1F6CD}\u{FE0F}'}
          </span>
          <span>Storefront</span>
        </Link>

        <nav className="layout__nav">
          <NavLink to="/" end className={navClass}>
            Browse
          </NavLink>
          {customer && (
            <NavLink to="/orders" className={navClass}>
              My orders
            </NavLink>
          )}
        </nav>

        <div className="layout__identity">
          {customer ? (
            <>
              <Link to="/account" className="layout__customer">
                <span className="layout__customer-name">{customer.name}</span>
                <span className="layout__customer-id mono">{customer.id}</span>
              </Link>
              <button type="button" className="button button--ghost button--small" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/sign-in" className="button button--primary button--small">
                Sign in
              </Link>
              <Link to="/register" className="button button--ghost button--small">
                Register
              </Link>
            </>
          )}
        </div>
      </header>

      <main className="layout__main">{children}</main>
    </div>
  );
}

function navClass({ isActive }: { isActive: boolean }): string {
  return isActive ? 'layout__nav-link layout__nav-link--active' : 'layout__nav-link';
}
