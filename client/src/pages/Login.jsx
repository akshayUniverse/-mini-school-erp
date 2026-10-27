import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ErrorMessage } from '../components/Common.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../api.js';

export default function Login() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-mark">MS</div>
        <p className="eyebrow">SCHOOL MANAGEMENT</p>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to your Mini School workspace.</p>
        <ErrorMessage>{error}</ErrorMessage>
        <label>Email<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        <button className="button button-primary button-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        <p className="login-hint">Demo: admin@school.com / admin123</p>
      </form>
    </main>
  );
}
