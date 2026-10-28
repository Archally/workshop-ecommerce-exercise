import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { customersApi } from '../api/client';
import { useCustomer } from '../context/CustomerContext';
import { ApiError } from '../api/ApiError';
import { ErrorPanel } from '../components/ErrorPanel';
import './RegisterPage.css';

export function SignInPage() {
  const navigate = useNavigate();
  const { customer, adoptSession } = useCustomer();

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [refused, setRefused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);

  if (customer) {
    return <Navigate to="/account" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRefused(false);
    setError(null);
    setSubmitting(true);
    try {
      const session = await customersApi.signIn(login.trim(), password);
      adoptSession(session);
      navigate('/account');
    } catch (signInError) {
      // A 401 is a refusal, not a fault: it gets the one message the service
      // returns, which never says which half was wrong. Anything else is a real
      // failure and goes to the error panel.
      if (signInError instanceof ApiError && signInError.status === 401) {
        setRefused(true);
      } else {
        setError(signInError);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <header className="register-page__header">
        <h1 className="section-title">Sign in</h1>
        <p className="section-subtitle">
          Your login is the email address you registered with.
        </p>
      </header>

      <div className="panel">
        <form className="customer-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login">Login</label>
            <input
              id="login"
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
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <button type="submit" className="button button--primary button--block" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {refused && (
          <p className="register-page__form-error" role="alert">
            Login or password is incorrect.
          </p>
        )}
        {error ? <ErrorPanel error={error} /> : null}

        <p className="register-page__hint">
          No account yet? <Link to="/register">Register</Link>.
        </p>
      </div>
    </div>
  );
}
