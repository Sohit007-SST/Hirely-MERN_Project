import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

const ROLES = [
  { value: 'client', title: 'I want to hire', text: 'Post gigs and compare bids from freelancers.' },
  { value: 'freelancer', title: 'I want to work', text: 'Find open gigs and send bids with your price.' },
];

export default function Register() {
  const { user, loading, register } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  // ?role=client|freelancer preselects the picker (links from the home page use it)
  const role = params.get('role') === 'client' ? 'client' : 'freelancer';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from;
  const dest = from?.pathname ? `${from.pathname}${from.search || ''}` : '/dashboard';

  if (loading) return <Loader full />;
  if (user) return <Navigate to={dest} replace />;

  const setRole = (value) => {
    const next = new URLSearchParams(params);
    next.set('role', value);
    setParams(next, { replace: true, state: location.state });
  };

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Enter your name';
    else if (form.name.trim().length > 50) errs.name = 'Use 50 characters or fewer';
    if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email, like you@example.com';
    if (form.password.length < 6) errs.password = 'Use at least 6 characters';
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
      const u = await register({ name: form.name.trim(), email: form.email.trim(), password: form.password, role });
      toast.success(`Welcome to Hirely, ${u.name.split(' ')[0]}`);
      navigate(dest, { replace: true });
    } catch (err) {
      // Show validation errors next to their fields; anything else at the top
      const byField = {};
      (err.errors || []).forEach(({ field, message }) => {
        if (field in form && !byField[field]) byField[field] = message;
      });
      if (/email/i.test(err.message) && !byField.email && err.status === 400) byField.email = err.message;
      setFieldErrors(byField);
      setError(Object.keys(byField).length ? '' : err.message);
      setSubmitting(false);
    }
  };

  const fieldProps = (name) => ({
    id: `register-${name}`,
    name,
    className: 'input',
    value: form[name],
    onChange,
    'aria-invalid': Boolean(fieldErrors[name]),
    'aria-describedby': fieldErrors[name] ? `register-${name}-error` : name === 'password' ? 'register-password-hint' : undefined,
  });

  return (
    <div className="auth container">
      <div className="card auth__card">
        <h1 className="auth__title">Create your account</h1>
        <p className="muted auth__sub">Free to join. You can post gigs or bid on them.</p>

        {error && <div className="alert alert--error" role="alert">{error}</div>}

        <form className="form" onSubmit={onSubmit} noValidate>
          <fieldset className="role-picker">
            <legend className="label">How will you use Hirely?</legend>
            <div className="role-picker__options">
              {ROLES.map((r) => (
                <label key={r.value} className="role-option">
                  <input
                    className="role-option__input"
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={role === r.value}
                    onChange={() => setRole(r.value)}
                  />
                  <span className="role-option__body">
                    <span className="role-option__title">{r.title}</span>
                    <span className="role-option__text">{r.text}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="field">
            <label className="label" htmlFor="register-name">Full name</label>
            <input {...fieldProps('name')} type="text" autoComplete="name" maxLength={50} />
            {fieldErrors.name && <p className="field-error" id="register-name-error">{fieldErrors.name}</p>}
          </div>

          <div className="field">
            <label className="label" htmlFor="register-email">Email</label>
            <input {...fieldProps('email')} type="email" autoComplete="email" />
            {fieldErrors.email && <p className="field-error" id="register-email-error">{fieldErrors.email}</p>}
          </div>

          <div className="field">
            <label className="label" htmlFor="register-password">Password</label>
            <input {...fieldProps('password')} type="password" autoComplete="new-password" />
            {fieldErrors.password ? (
              <p className="field-error" id="register-password-error">{fieldErrors.password}</p>
            ) : (
              <p className="hint" id="register-password-hint">At least 6 characters.</p>
            )}
          </div>

          <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={submitting}>
            {submitting ? 'Creating your account…' : 'Create account'}
          </button>
        </form>

        <p className="auth__switch">
          Already have an account?{' '}
          <Link className="link" to="/login" state={location.state}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
