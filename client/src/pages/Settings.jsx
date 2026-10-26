import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // same 2 MB limit as the server's multer config
const LIMITS = { name: 50, headline: 80, bio: 600, location: 80 };

const formFrom = (user) => ({
  name: user.name || '',
  headline: user.headline || '',
  bio: user.bio || '',
  location: user.location || '',
  skills: (user.skills || []).join(', '),
  hourlyRate: user.hourlyRate ? String(user.hourlyRate) : '',
});

// Session 8: choose -> preview -> upload (multipart FormData -> multer -> Cloudinary)
function AvatarCard() {
  const { user, setUser } = useAuth();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [notConfigured, setNotConfigured] = useState('');
  const [uploading, setUploading] = useState(false);

  // Local preview URL for the chosen file, released when it changes or the page closes
  useEffect(() => {
    if (!file) {
      setPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const reset = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onChoose = (e) => {
    const chosen = e.target.files?.[0];
    setError('');
    setNotConfigured('');
    if (!chosen) return;
    if (!chosen.type.startsWith('image/')) {
      setError('That file isn\'t an image. Choose a JPG, PNG or WebP photo.');
      reset();
      return;
    }
    if (chosen.size > MAX_AVATAR_BYTES) {
      setError(`That photo is ${(chosen.size / 1024 / 1024).toFixed(1)} MB. Choose one that's 2 MB or smaller.`);
      reset();
      return;
    }
    setFile(chosen);
  };

  const onUpload = async () => {
    if (!file) return;
    const body = new FormData();
    body.append('avatar', file);
    setUploading(true);
    setError('');
    setNotConfigured('');
    try {
      const { data } = await api.put('/users/me/avatar', body);
      setUser(data.user);
      reset();
      toast.success('Profile photo updated');
    } catch (err) {
      // 503: Cloudinary keys missing on the server - drop the preview, nothing can be uploaded
      if (err.status === 503) {
        setNotConfigured(err.message);
        reset();
      } else {
        setError(err.message);
      }
    } finally {
      setUploading(false);
    }
  };

  const shown = preview ? { ...user, avatar: { url: preview } } : user;

  return (
    <section className="card settings-avatar" aria-labelledby="avatar-title">
      <h2 id="avatar-title" className="card__title">Profile photo</h2>
      <Avatar user={shown} size="xl" />
      <p className="hint text-center">
        {file ? `Preview of ${file.name}. Upload it to replace your current photo.` : 'JPG, PNG or WebP, up to 2 MB.'}
      </p>

      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        tabIndex={-1}
        aria-label="Profile photo file"
        accept="image/*"
        onChange={onChoose}
      />

      {file ? (
        <div className="settings-avatar__actions">
          <button type="button" className="btn btn--primary" onClick={onUpload} disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload photo'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={reset} disabled={uploading}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn--secondary" onClick={() => inputRef.current?.click()}>
          Choose a photo
        </button>
      )}

      {error && <p className="field-error text-center" role="alert">{error}</p>}
      {notConfigured && (
        <div className="alert alert--info settings-avatar__alert" role="alert">
          <strong>Photo uploads are turned off on this server.</strong>
          <span>{notConfigured}, then restart the API and try again.</span>
        </div>
      )}
    </section>
  );
}

function ProfileForm() {
  const { user, setUser } = useAuth();
  const isFreelancer = user.role === 'freelancer';
  const [form, setForm] = useState(() => formFrom(user));
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Enter your name';
    Object.entries(LIMITS).forEach(([field, max]) => {
      if (form[field].trim().length > max) errs[field] = `Keep this to ${max} characters or fewer`;
    });
    if (isFreelancer && form.hourlyRate !== '' && !(Number(form.hourlyRate) >= 0)) {
      errs.hourlyRate = 'Enter a rate of ₹0 or more, or leave it empty';
    }
    return errs;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setFieldErrors(errs);
    setError('');
    if (Object.keys(errs).length) return;

    const body = {
      name: form.name.trim(),
      headline: form.headline.trim(),
      bio: form.bio.trim(),
      location: form.location.trim(),
    };
    if (isFreelancer) {
      body.skills = form.skills; // the server splits the comma-separated string
      body.hourlyRate = form.hourlyRate === '' ? 0 : Number(form.hourlyRate);
    }

    setSaving(true);
    try {
      const { data } = await api.put('/users/me', body);
      setUser(data.user); // the Navbar reads the same user, so it updates at once
      setForm(formFrom(data.user));
      toast.success('Profile saved');
    } catch (err) {
      if (err.errors?.length) {
        setFieldErrors(Object.fromEntries(err.errors.map((fe) => [fe.field, fe.message])));
      }
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Shared props for each input: id, value, error wiring
  const fieldProps = (name) => ({
    id: `settings-${name}`,
    name,
    value: form[name],
    onChange,
    'aria-invalid': Boolean(fieldErrors[name]),
    'aria-describedby': fieldErrors[name] ? `settings-${name}-error` : undefined,
  });

  const fieldError = (name) =>
    fieldErrors[name] ? (
      <p className="field-error" id={`settings-${name}-error`}>{fieldErrors[name]}</p>
    ) : null;

  return (
    <section className="card card--pad-lg" aria-labelledby="profile-form-title">
      <div className="card__head">
        <h2 id="profile-form-title" className="card__title">Profile details</h2>
        <Link className="link small" to={`/users/${user._id}`}>View your profile</Link>
      </div>

      {error && <div className="alert alert--error settings-alert" role="alert">{error}</div>}

      <form className="form" onSubmit={onSubmit} noValidate>
        <div className="form-row">
          <div className="field">
            <label className="label" htmlFor="settings-name">Name</label>
            <input className="input" type="text" autoComplete="name" maxLength={LIMITS.name} {...fieldProps('name')} />
            {fieldError('name')}
          </div>
          <div className="field">
            <label className="label" htmlFor="settings-location">
              Location <span className="muted">(optional)</span>
            </label>
            <input
              className="input"
              type="text"
              placeholder="e.g. Pune, India"
              maxLength={LIMITS.location}
              {...fieldProps('location')}
            />
            {fieldError('location')}
          </div>
        </div>

        <div className="field">
          <div className="settings-label-row">
            <label className="label" htmlFor="settings-headline">Headline</label>
            <span className="counter">{form.headline.length}/{LIMITS.headline}</span>
          </div>
          <input
            className="input"
            type="text"
            placeholder={isFreelancer ? 'e.g. React developer for fast, accessible sites' : 'e.g. Founder of a small skincare brand'}
            maxLength={LIMITS.headline}
            {...fieldProps('headline')}
          />
          {fieldError('headline') || <p className="hint">One line that shows under your name.</p>}
        </div>

        <div className="field">
          <div className="settings-label-row">
            <label className="label" htmlFor="settings-bio">Bio</label>
            <span className="counter" aria-live="polite">{form.bio.length}/{LIMITS.bio}</span>
          </div>
          <textarea
            className="textarea"
            rows={5}
            placeholder={isFreelancer ? 'What you do, who you work with and how you like to work.' : 'What your business does and the kind of work you hire for.'}
            maxLength={LIMITS.bio}
            {...fieldProps('bio')}
          />
          {fieldError('bio')}
        </div>

        {isFreelancer && (
          <div className="form-row">
            <div className="field">
              <label className="label" htmlFor="settings-skills">Skills</label>
              <input className="input" type="text" placeholder="React, Node.js, MongoDB" {...fieldProps('skills')} />
              {fieldError('skills') || <p className="hint">Separate skills with commas. Clients search by these.</p>}
            </div>
            <div className="field">
              <label className="label" htmlFor="settings-hourlyRate">
                Hourly rate in ₹ <span className="muted">(optional)</span>
              </label>
              <input className="input" type="number" min="0" step="50" inputMode="numeric" placeholder="800" {...fieldProps('hourlyRate')} />
              {fieldError('hourlyRate')}
            </div>
          </div>
        )}

        <div className="settings-actions">
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </section>
  );
}

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="container page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">
            Change how you appear to {user.role === 'freelancer' ? 'clients' : 'freelancers'}.
            Logged in as <strong>{user.email}</strong>.
          </p>
        </div>
      </header>

      <div className="settings-layout">
        <AvatarCard />
        <ProfileForm />
      </div>
    </div>
  );
}
