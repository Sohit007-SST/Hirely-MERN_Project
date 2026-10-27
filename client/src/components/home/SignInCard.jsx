// SignInCard: the sign-in form on the logged-out landing page. On success the user stays on "/" which turns into the feed.
// Server errors (wrong password, suspended account) show inline above the fields.
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function SignInCard() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [e.target.name]: '' }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter the email you signed up with';
    if (!form.password) errs.password = 'Enter your password';
    setFieldErrors(errs);
    setError('');
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      // Session 7: AuthContext stores the token; Home re-renders as the feed
      const u = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const errorId = (name) => (fieldErrors[name] ? `home-signin-${name}-error` : undefined);

  return (
    <section className="ui-card home-signin" aria-labelledby="home-signin-title">
      <h2 id="home-signin-title" className="home-signin__title">Sign in</h2>
      {error && (
        <p className="home-signin__alert" role="alert">
          {error}
        </p>
      )}
      <form className="home-signin__form" onSubmit={onSubmit} noValidate>
        <div className="home-field">
          <label className="home-field__label" htmlFor="home-signin-email">Email</label>
          <input
            id="home-signin-email"
            className="home-field__input"
            type="email"
            name="email"
            autoComplete="email"
            value={form.email}
            onChange={onChange}
            aria-invalid={Boolean(fieldErrors.email) || undefined}
            aria-describedby={errorId('email')}
          />
          {fieldErrors.email && <p className="home-field__error" id="home-signin-email-error">{fieldErrors.email}</p>}
        </div>
        <div className="home-field">
          <label className="home-field__label" htmlFor="home-signin-password">Password</label>
          <input
            id="home-signin-password"
            className="home-field__input"
            type="password"
            name="password"
            autoComplete="current-password"
            value={form.password}
            onChange={onChange}
            aria-invalid={Boolean(fieldErrors.password) || undefined}
            aria-describedby={errorId('password')}
          />
          {fieldErrors.password && <p className="home-field__error" id="home-signin-password-error">{fieldErrors.password}</p>}
        </div>
        <Button type="submit" block loading={submitting} loadingText="Signing in…">
          Sign in
        </Button>
      </form>
      <div className="home-signin__or" role="separator" aria-label="or">
        <span aria-hidden="true">or</span>
      </div>
      <Button variant="secondary" block to="/register">
        New to Hirely? Join now
      </Button>
    </section>
  );
}
