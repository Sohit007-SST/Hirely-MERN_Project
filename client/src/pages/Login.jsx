import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';
import AuthCard, { AuthCardSkeleton } from '../components/rest/AuthCard';
import FloatingField from '../components/rest/FloatingField';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// Where to go after signing in: back to the protected page that sent us here (Session 7)
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

  if (loading) return <AuthCardSkeleton />;
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
    <AuthCard
      title="Sign in"
      subtitle="Stay on top of your gigs, bids and messages."
      altText="New to Hirely? Join now"
      altTo="/register"
      altState={location.state}
    >
      {error && (
        <div className="rest-alert" role="alert">
          {error}
        </div>
      )}

      <form className="rest-auth__form" onSubmit={onSubmit} noValidate>
        <FloatingField
          id="login-email"
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          value={form.email}
          onChange={onChange}
          error={fieldErrors.email}
          autoFocus
        />
        <FloatingField
          id="login-password"
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          value={form.password}
          onChange={onChange}
          error={fieldErrors.password}
          revealable
        />
        <Button type="submit" block className="rest-auth__btn" loading={submitting} loadingText="Signing in…">
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
