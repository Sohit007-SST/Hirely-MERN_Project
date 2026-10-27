import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, SearchX, Sparkles, Undo2, X } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/shell/Layout';
import { Button, EmptyState, Skeleton } from '../components/ui';
import { CATEGORIES, sameId } from '../utils/format';
import GeminiNotice from '../components/gigs/GeminiNotice';
import { toFieldErrors } from '../components/gigs/gigHelpers';

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

// Centred 744px column used by every state of this page
function FormShell({ children }) {
  return (
    <Layout variant="full" className="gigs-formpage">
      <div className="gigs-formpage__col">{children}</div>
    </Layout>
  );
}

function FormSkeleton() {
  return (
    <FormShell>
      <div className="ui-card gigs-formcard gigs-pad gigs-skel-stack" role="status" aria-busy="true">
        <span className="ui-sr-only">Loading gig…</span>
        <Skeleton width={160} height={24} />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="gigs-skel-stack">
            <Skeleton width={96} height={12} />
            <Skeleton shape="rect" width="100%" height={44} />
          </div>
        ))}
        <Skeleton shape="rect" width="100%" height={160} />
      </div>
    </FormShell>
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

  const cancelTo = isEdit ? `/gigs/${id}` : '/dashboard';
  // X: back to wherever the client came from (or the Cancel target on a fresh tab)
  const close = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate(cancelTo));

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
      setFieldErrors(toFieldErrors(err.errors));
      setError(err.message);
      toast.error(err.message);
      setSubmitting(false);
    }
  };

  if (status === 'loading') return <FormSkeleton />;

  // Not found / load error / not the owner / not open: one message card each
  let blocked = null;
  if (status === 'notfound' || status === 'error') {
    const missing = status === 'notfound';
    blocked = (
      <EmptyState
        icon={SearchX}
        title={missing ? "This gig doesn't exist or was removed" : "Couldn't load this gig"}
        text={missing ? 'There is nothing to edit here. Post a new gig instead.' : `${loadError}. Refresh the page to try again.`}
        action={<Button to="/gigs/new">Post a new gig</Button>}
      />
    );
  } else if (isEdit && original && !sameId(original.client, user)) {
    // Edit is only for the owner, and only while the gig is open
    blocked = (
      <EmptyState
        icon={Lock}
        title="You can only edit your own gigs"
        text="This gig was posted by another client."
        action={<Button to={`/gigs/${id}`}>View the gig</Button>}
      />
    );
  } else if (isEdit && original && original.status !== 'open') {
    blocked = (
      <EmptyState
        icon={Lock}
        title="This gig can't be edited any more"
        text="Only open gigs can be edited. Once a freelancer is hired, the details are locked."
        action={<Button to={`/gigs/${id}`}>Back to the gig</Button>}
      />
    );
  }
  if (blocked) {
    return (
      <FormShell>
        <div className="ui-card">{blocked}</div>
      </FormShell>
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
    fieldErrors[name] && <p className="gigs-error" id={`gig-${name}-error`}>{fieldErrors[name]}</p>;

  return (
    <FormShell>
      <form className="ui-card gigs-formcard" onSubmit={onSubmit} noValidate aria-labelledby="gig-form-title">
        <header className="gigs-formcard__head">
          <div>
            <h1 id="gig-form-title" className="gigs-formcard__title">{isEdit ? 'Edit gig' : 'Post a gig'}</h1>
            <p className="gigs-formcard__sub">
              {isEdit
                ? 'Update the details while the gig is open. Freelancers see the changes straight away.'
                : 'A specific title, a realistic budget and clear deliverables get the best bids.'}
            </p>
          </div>
          <Button variant="tertiary" icon={X} aria-label="Close" onClick={close} />
        </header>

        <div className="gigs-formcard__body">
          {error && <div className="gigs-alert gigs-alert--error" role="alert">{error}</div>}

          <section className="gigs-formsec" aria-labelledby="sec-basics">
            <h2 id="sec-basics" className="gigs-formsec__label">Basics</h2>
            <div className="gigs-field">
              <div className="gigs-field__top">
                <label className="label" htmlFor="gig-title">Title</label>
                <span className="counter">{form.title.length} / 100</span>
              </div>
              <input
                className="input"
                maxLength={100}
                placeholder="e.g. Build a landing page for my bakery"
                autoFocus={!isEdit}
                {...fieldProps('title')}
              />
              {fieldError('title') || <p className="gigs-hint" id="gig-title-hint">Say what you need in one line.</p>}
            </div>
            <div className="gigs-field">
              <label className="label" htmlFor="gig-category">Category</label>
              <select className="select" {...fieldProps('category', false)}>
                <option value="">Choose a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {fieldError('category')}
            </div>
          </section>

          <section className="gigs-formsec" aria-labelledby="sec-budget">
            <h2 id="sec-budget" className="gigs-formsec__label">Budget and timing</h2>
            <div className="gigs-form-row">
              <div className="gigs-field">
                <label className="label" htmlFor="gig-budget">Budget (₹)</label>
                <input className="input" inputMode="numeric" placeholder="e.g. 15000" {...fieldProps('budget')} />
                {fieldError('budget') || <p className="gigs-hint" id="gig-budget-hint">The total you'll pay, at least ₹100.</p>}
              </div>
              <div className="gigs-field">
                <label className="label" htmlFor="gig-deadline">Deadline <span className="gigs-muted">(optional)</span></label>
                <input className="input" type="date" min={tomorrow()} {...fieldProps('deadline')} />
                {fieldError('deadline') || <p className="gigs-hint" id="gig-deadline-hint">Leave it empty if the date is flexible.</p>}
              </div>
            </div>
          </section>

          <section className="gigs-formsec" aria-labelledby="sec-skills">
            <h2 id="sec-skills" className="gigs-formsec__label">Skills</h2>
            <div className="gigs-field">
              <label className="label" htmlFor="gig-skills">Skills needed <span className="gigs-muted">(optional)</span></label>
              <input className="input" placeholder="e.g. React, Figma, SEO" {...fieldProps('skills')} />
              {fieldError('skills') || <p className="gigs-hint" id="gig-skills-hint">Separate skills with commas. Up to 15.</p>}
            </div>
            {skills.length > 0 && (
              <ul className="gigs-chips" aria-label="Skills preview">
                {skills.map((s) => (
                  <li key={s} className="gigs-chip">{s}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="gigs-formsec" aria-labelledby="sec-description">
            <h2 id="sec-description" className="gigs-formsec__label">Description</h2>
            <div className="gigs-field">
              <div className="gigs-ai-bar">
                <label className="label" htmlFor="gig-description">What needs doing</label>
                <button
                  type="button"
                  className="gigs-ai-pill"
                  disabled={!canImprove || aiBusy}
                  onClick={improveWithGemini}
                  aria-describedby="gig-ai-hint"
                  aria-busy={aiBusy || undefined}
                >
                  <Sparkles size={16} aria-hidden="true" focusable="false" />
                  {aiBusy ? 'Improving…' : 'Improve with Gemini'}
                </button>
              </div>
              <p className="gigs-hint" id="gig-ai-hint">
                {canImprove
                  ? 'Rough notes are fine. Gemini can turn them into a clear brief.'
                  : 'Add a title and at least 10 characters of notes to use Gemini.'}
              </p>
              <GeminiNotice error={aiError} what="the description" />
              {notesBackup !== null && (
                <div className="gigs-alert gigs-alert--success" role="status">
                  <span>Gemini rewrote your notes. Read it through and edit anything that isn't right.</span>
                  <Button variant="tertiary" size="sm" icon={Undo2} onClick={undoGemini}>Undo</Button>
                </div>
              )}
              <textarea
                className="textarea gigs-textarea--tall"
                maxLength={3000}
                placeholder="What needs doing, what you already have, and what you expect to receive."
                {...fieldProps('description')}
              />
              <div className="gigs-field__top">
                {fieldError('description') || <p className="gigs-hint" id="gig-description-hint">At least 20 characters.</p>}
                <span className="counter">{form.description.length} / 3000</span>
              </div>
            </div>
          </section>
        </div>

        <footer className="gigs-formcard__foot">
          <Button variant="tertiary" to={cancelTo}>Cancel</Button>
          <Button type="submit" loading={submitting} loadingText={isEdit ? 'Saving…' : 'Posting…'}>
            {isEdit ? 'Save changes' : 'Post gig'}
          </Button>
        </footer>
      </form>
    </FormShell>
  );
}
