import { useState } from 'react';
import type { FormEvent } from 'react';
import type { CustomerDraft } from '../api/customers/CustomerDraft';
import './CustomerForm.css';

const EMPTY_DRAFT: CustomerDraft = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: ''
};

// Only name and email are required, matching UpdateCustomerRequest.cs: the six
// postal fields can be saved one at a time as they arrive.
interface CustomerFormProps {
  initial?: CustomerDraft;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (draft: CustomerDraft) => void;
}

export function CustomerForm({ initial, submitLabel, submitting, onSubmit }: CustomerFormProps) {
  const [draft, setDraft] = useState<CustomerDraft>(initial ?? EMPTY_DRAFT);

  const setField = (field: keyof CustomerDraft) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setDraft((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(draft);
  };

  return (
    <form className="customer-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" required value={draft.name} onChange={setField('name')} />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={draft.email} onChange={setField('email')} />
        </div>
        <div className="field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" value={draft.phone ?? ''} onChange={setField('phone')} />
        </div>
        <div className="field">
          <label htmlFor="address">Street address</label>
          <input id="address" value={draft.address ?? ''} onChange={setField('address')} />
        </div>
        <div className="field">
          <label htmlFor="city">City</label>
          <input id="city" value={draft.city ?? ''} onChange={setField('city')} />
        </div>
        <div className="field">
          <label htmlFor="state">State</label>
          <input id="state" value={draft.state ?? ''} onChange={setField('state')} />
        </div>
        <div className="field">
          <label htmlFor="zip">Zip code</label>
          <input id="zip" value={draft.zip ?? ''} onChange={setField('zip')} />
        </div>
        <div className="field">
          <label htmlFor="country">Country</label>
          <input id="country" value={draft.country ?? ''} onChange={setField('country')} />
        </div>
      </div>

      <button type="submit" className="button button--primary button--block" disabled={submitting}>
        {submitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
