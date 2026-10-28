import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { customersApi } from '../api/client';
import { ErrorPanel } from '../components/ErrorPanel';
import { useCustomer } from '../context/CustomerContext';
import type { RegistrationDraft } from '../api/customers/RegistrationDraft';
import './RegisterPage.css';

const MIN_PASSWORD_LENGTH = 8;

export function RegisterPage() {
  const navigate = useNavigate();
  const { customer, adoptSession } = useCustomer();

  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  if (customer) {
    return <Navigate to="/account" replace />;
  }

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const draft: RegistrationDraft = {
      name: name.trim(),
      email: login.trim(),
      password
    };
    if (!draft.name || !draft.email || !draft.password) {
      setFormError('Enter a name, a login and a password.');
      return;
    }
    if (draft.password.length < MIN_PASSWORD_LENGTH) {
      setFormError(`The password needs at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    setFormError(null);
    setSubmitting(true);
    setError(null);
    try {
      await customersApi.register(draft);
      // Registration creates the account; signing in is what produces a session,
      // so a new customer walks the same path a returning one does.
      const session = await customersApi.signIn(draft.email, draft.password);
      adoptSession(session);
      navigate('/account');
    } catch (submitError) {
      setError(submitError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <header className="register-page__header">
        <h1 className="section-title">Create an account</h1>
        <p className="section-subtitle">
          Your email address is the login you will sign in with. The delivery address comes later, on
          your account page.
        </p>
      </header>

      <div className="panel">
        <form className="customer-form" onSubmit={handleRegister}>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              required
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="login">Login</label>
            <input
              id="login"
              type="email"
              required
              autoComplete="username"
              value={login}
              onChange={(event) => setLogin(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <button type="submit" className="button button--primary button--block" disabled={submitting}>
            {submitting ? 'Registering...' : 'Register'}
          </button>
        </form>

        {formError && (
          <p className="register-page__form-error" role="alert">
            {formError}
          </p>
        )}
        {error ? <ErrorPanel error={error} /> : null}

        <p className="register-page__hint">
          Already registered? <Link to="/sign-in">Sign in</Link>.
        </p>
      </div>
    </div>
  );
}
