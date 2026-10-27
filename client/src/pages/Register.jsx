import { useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Briefcase, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui';
import AuthCard, { AuthCardSkeleton } from '../components/rest/AuthCard';
import FloatingField from '../components/rest/FloatingField';
import RoleCard from '../components/rest/RoleCard';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

const ROLES = [
  { value: 'client', icon: Briefcase, title: 'I want to hire', text: 'Post gigs and compare bids.' },
  { value: 'freelancer', icon: User, title: 'I want to work', text: 'Find gigs and send bids.' },
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

  if (loading) return <AuthCardSkeleton />;
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

  const field = (name) => ({
    id: `register-${name}`,
    name,
    value: form[name],
    onChange,
    error: fieldErrors[name],
  });

  return (
    <AuthCard
      title="Join Hirely"
      subtitle="Free to join. Post gigs or bid on them."
      altText="Already on Hirely? Sign in"
      altTo="/login"
      altState={location.state}
    >
      {error && (
        <div className="rest-alert" role="alert">
          {error}
        </div>
      )}

      <form className="rest-auth__form" onSubmit={onSubmit} noValidate>
        <fieldset className="rest-roles">
          <legend className="rest-roles__legend">How will you use Hirely?</legend>
          <div className="rest-roles__grid">
            {ROLES.map((r) => (
              <RoleCard key={r.value} name="role" {...r} checked={role === r.value} onChange={setRole} />
            ))}
          </div>
        </fieldset>

        <FloatingField {...field('name')} label="Full name" type="text" autoComplete="name" maxLength={50} />
        <FloatingField {...field('email')} label="Email" type="email" autoComplete="email" />
        <FloatingField
          {...field('password')}
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 6 characters."
          revealable
        />

        <Button type="submit" block className="rest-auth__btn" loading={submitting} loadingText="Creating your account…">
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
