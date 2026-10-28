import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { customersApi } from '../api/client';
import { CustomerForm } from '../components/CustomerForm';
import { ErrorPanel } from '../components/ErrorPanel';
import { LoadingState } from '../components/LoadingState';
import { useCustomer } from '../context/CustomerContext';
import type { Customer } from '../api/customers/Customer';
import type { CustomerDraft } from '../api/customers/CustomerDraft';
import type { Discount } from '../api/customers/Discount';
import { formatMoney } from '../formatting';
import './AccountPage.css';

// A freshly registered customer has none of the postal details yet. Saying so
// is the honest empty state; Edit details is the button beside it.
const NOT_ON_FILE = 'Not on file yet - add it with Edit details';

type DiscountsState = { kind: 'loading' } | { kind: 'error'; error: unknown } | { kind: 'ready'; discounts: Discount[] };

export function AccountPage() {
  const { customer, initializing, refreshCustomer, signOut } = useCustomer();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<unknown>(null);

  const [discountsState, setDiscountsState] = useState<DiscountsState>({ kind: 'loading' });

  const loadDiscounts = () => {
    if (!customer) {
      return;
    }
    setDiscountsState({ kind: 'loading' });
    customersApi
      .discounts(customer.id)
      .then((response) => setDiscountsState({ kind: 'ready', discounts: response.discounts }))
      .catch((error: unknown) => setDiscountsState({ kind: 'error', error }));
  };

  useEffect(loadDiscounts, [customer]);

  if (initializing) {
    return <LoadingState label="Loading your session..." />;
  }

  if (!customer) {
    return <Navigate to="/sign-in" replace />;
  }

  const handleSave = async (draft: CustomerDraft) => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await customersApi.update(customer.id, draft);
      refreshCustomer(updated);
      setEditing(false);
    } catch (error) {
      setSaveError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="account-page">
      <header className="account-page__header">
        <div>
          <h1 className="section-title">My account</h1>
          <p className="section-subtitle mono">{customer.id}</p>
        </div>
        <div className="account-page__actions">
          <button type="button" className="button button--ghost" onClick={() => navigate('/orders')}>
            View orders
          </button>
          <button type="button" className="button button--ghost" onClick={() => setEditing((value) => !value)}>
            {editing ? 'Cancel' : 'Edit details'}
          </button>
          <button type="button" className="button button--danger" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <div className="account-page__grid">
        <div className="panel">
          <h2 className="account-page__panel-title">Details</h2>
          {editing ? (
            <CustomerForm initial={customer} submitLabel="Save changes" submitting={saving} onSubmit={handleSave} />
          ) : (
            <dl className="kv">
              <dt>Name</dt>
              <dd>{customer.name}</dd>
              <dt>Email</dt>
              <dd>{customer.email}</dd>
              <dt>Phone</dt>
              <dd>{customer.phone.trim() || NOT_ON_FILE}</dd>
              <dt>Address</dt>
              <dd>{formatAddress(customer) ?? NOT_ON_FILE}</dd>
              <dt>Status</dt>
              <dd>{customer.isActive ? 'Active' : 'Inactive'}</dd>
            </dl>
          )}
          {saveError ? <ErrorPanel error={saveError} /> : null}
        </div>

        <div className="panel">
          <h2 className="account-page__panel-title">Discounts on file</h2>
          {discountsState.kind === 'loading' && <LoadingState label="Loading discounts..." />}
          {discountsState.kind === 'error' && <ErrorPanel error={discountsState.error} onRetry={loadDiscounts} />}
          {discountsState.kind === 'ready' && discountsState.discounts.length === 0 && (
            <p className="account-page__empty">No discounts on file yet.</p>
          )}
          {discountsState.kind === 'ready' && discountsState.discounts.length > 0 && (
            <ul className="account-page__discount-list">
              {discountsState.discounts.map((discount) => (
                <li key={`${discount.type}-${discount.amount}`} className="account-page__discount">
                  <span className="badge badge--discount">{discount.type.replace(/_/g, ' ')}</span>
                  <div>
                    <p className="account-page__discount-amount">
                      {discount.percentage ? `${discount.percentage}% ` : ''}
                      {formatMoney(discount.amount)} off
                    </p>
                    {discount.description && <p className="account-page__discount-description">{discount.description}</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// A freshly registered customer has no postal details at all, so the joined form
// would read ", ,  , ". Null means nothing on file.
function formatAddress(customer: Customer): string | null {
  const parts = [customer.address, customer.city, [customer.state, customer.zip].filter(Boolean).join(' '), customer.country];
  const filled = parts.map((part) => part.trim()).filter((part) => part.length > 0);
  return filled.length > 0 ? filled.join(', ') : null;
}
