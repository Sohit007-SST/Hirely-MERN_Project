import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// Where to go after logging in: back to the protected page that sent us here (Session 7)
const destination = (state) => {
  const from = state?.from;
  if (!from?.pathname || from.pathname === '/login') return '/dashboard';
  return `${from.pathname}${from.search || ''}`;
};

export default function Login() {
  const { user, loading, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const dest = destination(location.state);

  if (loading) return <Loader full />;
  if (user) return <Navigate to={dest} replace />;

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter the email you signed up with';
    if (!form.password) errs.password = 'Enter your password';
    return errs;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setFieldErrors(errs);
    setError('');
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const u = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}`);
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="auth container">
      <div className="card auth__card">
        <h1 className="auth__title">Log in to GigBazaar</h1>
        <p className="muted auth__sub">Pick up where you left off.</p>

        {error && <div className="alert alert--error" role="alert">{error}</div>}

        <form className="form" onSubmit={onSubmit} noValidate>
          <div className="field">
            <label className="label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="input"
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={onChange}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
              autoFocus
            />
            {fieldErrors.email && <p className="field-error" id="login-email-error">{fieldErrors.email}</p>}
          </div>

          <div className="field">
            <label className="label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="input"
              type="password"
              name="password"
              autoComplete="current-password"
              value={form.password}
              onChange={onChange}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
            />
            {fieldErrors.password && <p className="field-error" id="login-password-error">{fieldErrors.password}</p>}
          </div>

          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="auth__switch">
          New to GigBazaar?{' '}
          <Link className="link" to="/register" state={location.state}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
