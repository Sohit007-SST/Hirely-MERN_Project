import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import { CATEGORIES, sameId } from '../utils/format';

const EMPTY = { title: '', category: '', budget: '', deadline: '', skills: '', description: '' };

// "React, Node , react" -> ['React', 'Node'] (the server cleans the list the same way)
const parseSkills = (text) => {
  const seen = new Set();
  return text
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()))
    .slice(0, 15);
};

// <input type="date"> works in local "YYYY-MM-DD" strings
const toDateInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// The deadline must be in the future, so the earliest pick is tomorrow
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toDateInput(d);
};

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function GigForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [original, setOriginal] = useState(null); // the loaded gig in edit mode
  const [status, setStatus] = useState(isEdit ? 'loading' : 'ready'); // loading | ready | notfound | error
  const [loadError, setLoadError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [notesBackup, setNotesBackup] = useState(null); // lets the client undo the Gemini rewrite

  // Edit mode: load the gig and fill the form
  useEffect(() => {
    if (!isEdit) {
      setForm(EMPTY);
      setOriginal(null);
      setStatus('ready');
      return undefined;
    }
    const controller = new AbortController();
    setStatus('loading');
    api
      .get(`/gigs/${id}`, { signal: controller.signal })
      .then(({ data }) => {
        const g = data.gig;
        setOriginal(g);
        setForm({
          title: g.title,
          category: g.category,
          budget: String(g.budget),
          deadline: toDateInput(g.deadline),
          skills: (g.skills || []).join(', '),
          description: g.description,
        });
        setStatus('ready');
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setLoadError(err.message);
        setStatus(err.status === 404 ? 'notfound' : 'error');
      });
    return () => controller.abort();
  }, [id, isEdit]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === 'budget' ? value.replace(/\D/g, '').slice(0, 9) : value }));
    setFieldErrors((fe) => ({ ...fe, [name]: '' }));
    setError('');
    if (name === 'description') setNotesBackup(null);
  };

  const canImprove = form.title.trim().length > 0 && form.description.trim().length >= 10;

  // Session 15: Gemini rewrites rough notes. It only replaces the textarea text, which stays editable.
  const improveWithGemini = async () => {
    setAiBusy(true);
    setAiError(null);
    try {
      const { data } = await api.post('/ai/gig-description', {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category || undefined,
      });
      setNotesBackup(form.description);
      setForm((f) => ({ ...f, description: data.text.slice(0, 3000) }));
      setFieldErrors((fe) => ({ ...fe, description: '' }));
    } catch (err) {
      setAiError({ status: err.status, message: err.message });
    } finally {
      setAiBusy(false);
    }
  };

  const undoGemini = () => {
    setForm((f) => ({ ...f, description: notesBackup }));
    setNotesBackup(null);
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Give the gig a short, clear title';
    if (!form.category) errs.category = 'Pick the category that fits best';
    if (!(Number(form.budget) >= 100)) errs.budget = 'Set a budget of at least ₹100';
    if (form.deadline && form.deadline !== toDateInput(original?.deadline) && form.deadline < tomorrow()) {
      errs.deadline = 'Pick a date from tomorrow onwards';
    }
    const length = form.description.trim().length;
    if (length < 20) errs.description = `Describe the work in at least 20 characters (${20 - length} more)`;
    return errs;
  };

  // Session 3: create (POST) and update (PUT) with the same form
  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setFieldErrors(errs);
    setError('');
    if (Object.keys(errs).length) {
      setError('Fix the highlighted fields and try again.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      category: form.category,
      budget: Number(form.budget),
      skills: parseSkills(form.skills),
      description: form.description.trim(),
    };
    // Only send the deadline when it changed, so an older saved date doesn't fail the "future" check
    if (!isEdit) {
      if (form.deadline) payload.deadline = form.deadline;
    } else if (form.deadline !== toDateInput(original?.deadline)) {
      payload.deadline = form.deadline; // '' clears it
    }

    setSubmitting(true);
    try {
      const { data } = isEdit ? await api.put(`/gigs/${id}`, payload) : await api.post('/gigs', payload);
      toast.success(isEdit ? 'Changes saved' : 'Gig posted. Freelancers can bid now');
      navigate(`/gigs/${data.gig._id}`);
    } catch (err) {
      const byField = {};
      (err.errors || []).forEach((fe) => {
        if (!byField[fe.field]) byField[fe.field] = fe.message;
      });
      setFieldErrors(byField);
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (status === 'loading') return <Loader full label="Loading gig" />;

  if (status === 'notfound' || status === 'error') {
    return (
      <div className="container page">
        <EmptyState
          title={status === 'notfound' ? "This gig doesn't exist or was removed" : "Couldn't load this gig"}
          text={status === 'notfound' ? 'There is nothing to edit here. Post a new gig instead.' : `${loadError}. Refresh the page to try again.`}
          action={<Link className="btn btn--primary" to="/gigs/new">Post a new gig</Link>}
        />
      </div>
    );
  }

  // Edit is only for the owner, and only while the gig is open
  if (isEdit && original && !sameId(original.client, user)) {
    return (
      <div className="container page">
        <EmptyState
          title="You can only edit your own gigs"
          text="This gig was posted by another client."
          action={<Link className="btn btn--primary" to={`/gigs/${id}`}>View the gig</Link>}
        />
      </div>
    );
  }

  if (isEdit && original && original.status !== 'open') {
    return (
      <div className="container page">
        <EmptyState
          title="This gig can't be edited any more"
          text="Only open gigs can be edited. Once a freelancer is hired, the details are locked."
          action={<Link className="btn btn--primary" to={`/gigs/${id}`}>Back to the gig</Link>}
        />
      </div>
    );
  }

  const skills = parseSkills(form.skills);
  const fieldProps = (name, hasHint = true) => ({
    id: `gig-${name}`,
    name,
    value: form[name],
    onChange,
    'aria-invalid': Boolean(fieldErrors[name]),
    'aria-describedby': fieldErrors[name] ? `gig-${name}-error` : hasHint ? `gig-${name}-hint` : undefined,
  });
  const fieldError = (name) =>
    fieldErrors[name] && <p className="field-error" id={`gig-${name}-error`}>{fieldErrors[name]}</p>;

  return (
    <div className="container page">
      <header className="page-head">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit gig' : 'Post a gig'}</h1>
          <p className="page-sub">
            {isEdit
              ? 'Update the details while the gig is open. Freelancers see the changes straight away.'
              : 'Describe the work, set a budget in rupees, and freelancers will start sending bids.'}
          </p>
        </div>
      </header>

      <div className="layout-2col">
        <form className="card card--pad-lg form gig-form" onSubmit={onSubmit} noValidate>
          {error && <div className="alert alert--error" role="alert">{error}</div>}

          <div className="field">
            <div className="field__top">
              <label className="label" htmlFor="gig-title">Title</label>
              <span className="counter">{form.title.length} / 100</span>
            </div>
            <input className="input" maxLength={100} placeholder="e.g. Build a landing page for my bakery" autoFocus={!isEdit} {...fieldProps('title')} />
            {fieldError('title') || <p className="hint" id="gig-title-hint">Say what you need in one line.</p>}
          </div>

          <div className="form-row">
            <div className="field">
              <label className="label" htmlFor="gig-category">Category</label>
              <select className="select" {...fieldProps('category', false)}>
                <option value="">Choose a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {fieldError('category')}
            </div>

            <div className="field">
              <label className="label" htmlFor="gig-budget">Budget (₹)</label>
              <input className="input" inputMode="numeric" placeholder="e.g. 15000" {...fieldProps('budget')} />
              {fieldError('budget') || <p className="hint" id="gig-budget-hint">The total you'll pay, at least ₹100.</p>}
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label className="label" htmlFor="gig-deadline">Deadline <span className="muted">(optional)</span></label>
              <input className="input" type="date" min={tomorrow()} {...fieldProps('deadline')} />
              {fieldError('deadline') || <p className="hint" id="gig-deadline-hint">Leave it empty if the date is flexible.</p>}
            </div>

            <div className="field">
              <label className="label" htmlFor="gig-skills">Skills <span className="muted">(optional)</span></label>
              <input className="input" placeholder="e.g. React, Figma, SEO" {...fieldProps('skills')} />
              {fieldError('skills') || <p className="hint" id="gig-skills-hint">Separate skills with commas. Up to 15.</p>}
            </div>
          </div>

          {skills.length > 0 && (
            <ul className="chips gig-form__skills" aria-label="Skills preview">
              {skills.map((s) => (
                <li key={s} className="chip">{s}</li>
              ))}
            </ul>
          )}

          <div className="field">
            <div className="ai-bar">
              <div>
                <label className="label" htmlFor="gig-description">Description</label>
                <p className="hint">Rough notes are fine. Gemini can turn them into a clear brief.</p>
              </div>
              <button
                type="button"
                className="btn btn--ink btn--sm"
                disabled={!canImprove || aiBusy}
                onClick={improveWithGemini}
                aria-describedby="gig-ai-hint"
              >
                <SparkIcon />
                {aiBusy ? 'Improving…' : 'Improve with Gemini'}
              </button>
            </div>
            {!canImprove && (
              <p className="hint" id="gig-ai-hint">Add a title and at least 10 characters of notes to use Gemini.</p>
            )}
            {aiError &&
              (aiError.status === 503 ? (
                <div className="alert alert--info" role="status">
                  <strong>Gemini isn't set up on this server yet.</strong> You can still write the description yourself.
                  <span className="ai-box__detail">{aiError.message}</span>
                </div>
              ) : (
                <p className="field-error" role="alert">{aiError.message}</p>
              ))}
            {notesBackup !== null && (
              <div className="alert alert--success ai-done" role="status">
                <span>Gemini rewrote your notes. Read it through and edit anything that isn't right.</span>
                <button type="button" className="btn btn--ghost btn--sm" onClick={undoGemini}>
                  Undo
                </button>
              </div>
            )}
            <textarea
              className="textarea textarea--tall"
              maxLength={3000}
              placeholder="What needs doing, what you already have, and what you expect to receive."
              {...fieldProps('description')}
            />
            <div className="field__top">
              {fieldError('description') || <p className="hint" id="gig-description-hint">At least 20 characters.</p>}
              <span className="counter">{form.description.length} / 3000</span>
            </div>
          </div>

          <div className="gig-form__actions">
            <Link className="btn btn--ghost" to={isEdit ? `/gigs/${id}` : '/dashboard'}>Cancel</Link>
            <button type="submit" className="btn btn--primary btn--lg" disabled={submitting}>
              {submitting ? (isEdit ? 'Saving…' : 'Posting…') : isEdit ? 'Save changes' : 'Post gig'}
            </button>
          </div>
        </form>

        <aside className="layout-2col__side" aria-label="Tips">
          <section className="card side-card gig-tips">
            <h2 className="card__title">What gets good bids</h2>
            <ol className="gig-tips__list">
              <li><strong>A specific title.</strong> “Logo for a skincare brand” beats “Need a designer”.</li>
              <li><strong>A realistic budget.</strong> Freelancers bid around it, so set what the work is worth.</li>
              <li><strong>Clear deliverables.</strong> List the files or pages you expect at the end.</li>
            </ol>
            <p className="small muted">You can edit the gig until you hire someone.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
