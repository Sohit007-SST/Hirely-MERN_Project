// EditIntroForm: the "Edit intro" profile form (photo, basic info, about, skills and rate), shared by the /settings page
// and the Edit intro Modal on the profile. The submit button lives in the caller's sticky footer (<button form={id}>).
// Props: { id: string (form id for the footer button), onSaved?: (user) => void, onSavingChange?: (saving) => void,
//          firstFieldRef?: ref (the Name input, e.g. for Modal initialFocusRef), onPhotoUploaded?: (user) => void,
//          headingAs?: 'h2'|'h3' = 'h2' (section headings: h2 under the /settings h1, h3 inside the Modal) }
import { useEffect, useId, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import AvatarUploader from './AvatarUploader';

const LIMITS = { name: 50, headline: 80, bio: 600, location: 80 };

const formFrom = (user) => ({
  name: user.name || '',
  headline: user.headline || '',
  bio: user.bio || '',
  location: user.location || '',
  skills: (user.skills || []).join(', '),
  hourlyRate: user.hourlyRate ? String(user.hourlyRate) : '',
});

// A titled group of fields
function FormSection({ title, headingAs: Heading, children }) {
  const titleId = useId();
  return (
    <section className="people-form__section" aria-labelledby={titleId}>
      <Heading id={titleId} className="people-form__legend">{title}</Heading>
      <div className="people-form__fields">{children}</div>
    </section>
  );
}

export default function EditIntroForm({ id, onSaved, onSavingChange, firstFieldRef, onPhotoUploaded, headingAs = 'h2' }) {
  const { user, setUser } = useAuth();
  const prefix = useId();
  const isFreelancer = user.role === 'freelancer';
  const [form, setForm] = useState(() => formFrom(user));
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    onSavingChange?.(saving);
  }, [saving, onSavingChange]);

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
    if (Object.keys(errs).length) {
      document.getElementById(`${prefix}-${Object.keys(errs)[0]}`)?.focus();
      return;
    }

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
      setUser(data.user); // the nav reads the same user, so it updates at once
      setForm(formFrom(data.user));
      toast.success('Profile saved');
      onSaved?.(data.user);
    } catch (err) {
      if (err.errors?.length) {
        setFieldErrors(Object.fromEntries(err.errors.map((fe) => [fe.field, fe.message])));
      } else {
        setError(err.message);
      }
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Shared props for each input: id, value, error wiring
  const fieldProps = (name, hint) => {
    const described = [fieldErrors[name] && `${prefix}-${name}-error`, hint && `${prefix}-${name}-hint`].filter(Boolean);
    return {
      id: `${prefix}-${name}`,
      name,
      value: form[name],
      onChange,
      'aria-invalid': Boolean(fieldErrors[name]),
      'aria-describedby': described.length ? described.join(' ') : undefined,
    };
  };

  const fieldError = (name) =>
    fieldErrors[name] ? (
      <p className="people-error" id={`${prefix}-${name}-error`}>{fieldErrors[name]}</p>
    ) : null;

  const counter = (name) => (
    <span className="people-counter" aria-hidden="true">{form[name].length}/{LIMITS[name]}</span>
  );

  return (
    <form id={id} className="people-form" onSubmit={onSubmit} noValidate aria-busy={saving}>
      {error && <p className="people-error people-form__alert" role="alert">{error}</p>}

      <FormSection title="Profile photo" headingAs={headingAs}>
        <AvatarUploader onUploaded={onPhotoUploaded} />
      </FormSection>

      <FormSection title="Basic info" headingAs={headingAs}>
        <div className="people-field">
          <label className="people-label" htmlFor={`${prefix}-name`}>Name</label>
          <input ref={firstFieldRef} className="people-input" type="text" autoComplete="name" maxLength={LIMITS.name} {...fieldProps('name')} />
          {fieldError('name')}
        </div>

        <div className="people-field">
          <div className="people-label-row">
            <label className="people-label" htmlFor={`${prefix}-headline`}>Headline</label>
            {counter('headline')}
          </div>
          <input
            className="people-input"
            type="text"
            placeholder={isFreelancer ? 'e.g. React developer for fast, accessible sites' : 'e.g. Founder of a small skincare brand'}
            maxLength={LIMITS.headline}
            {...fieldProps('headline', true)}
          />
          {fieldError('headline')}
          <p className="people-hint" id={`${prefix}-headline-hint`}>One line that shows under your name.</p>
        </div>

        <div className="people-field">
          <label className="people-label" htmlFor={`${prefix}-location`}>
            Location <span className="people-label__opt">(optional)</span>
          </label>
          <input className="people-input" type="text" placeholder="e.g. Pune, India" maxLength={LIMITS.location} {...fieldProps('location')} />
          {fieldError('location')}
        </div>
      </FormSection>

      <FormSection title="About" headingAs={headingAs}>
        <div className="people-field">
          <div className="people-label-row">
            <label className="people-label" htmlFor={`${prefix}-bio`}>Bio</label>
            {counter('bio')}
          </div>
          <textarea
            className="people-input people-input--area"
            rows={5}
            placeholder={isFreelancer ? 'What you do, who you work with and how you like to work.' : 'What your business does and the kind of work you hire for.'}
            maxLength={LIMITS.bio}
            {...fieldProps('bio')}
          />
          {fieldError('bio')}
        </div>
      </FormSection>

      {isFreelancer && (
        <FormSection title="Skills and rate" headingAs={headingAs}>
          <div className="people-field">
            <label className="people-label" htmlFor={`${prefix}-skills`}>Skills</label>
            <input className="people-input" type="text" placeholder="React, Node.js, MongoDB" {...fieldProps('skills', true)} />
            {fieldError('skills')}
            <p className="people-hint" id={`${prefix}-skills-hint`}>Separate skills with commas. Clients search by these.</p>
          </div>
          <div className="people-field people-field--short">
            <label className="people-label" htmlFor={`${prefix}-hourlyRate`}>
              Hourly rate in ₹ <span className="people-label__opt">(optional)</span>
            </label>
            <input className="people-input" type="number" min="0" step="50" inputMode="numeric" placeholder="800" {...fieldProps('hourlyRate')} />
            {fieldError('hourlyRate')}
          </div>
        </FormSection>
      )}
    </form>
  );
}
