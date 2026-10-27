// BidFormCard: the freelancer's "Place a bid" card - price and delivery inputs, the soft-teal Gemini box, and the proposal.
// Gemini only fills the textarea; the freelancer edits it and sends the bid themselves.
// Props: { gig, previous?: bid (a withdrawn bid, used to prefill a re-bid), onPlaced(bid) }
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Send, Sparkles } from 'lucide-react';
import api from '../../api/axios';
import { Button, Card } from '../ui';
import { formatINR } from '../../utils/format';
import ConfirmDialog from './ConfirmDialog';
import GeminiNotice from './GeminiNotice';
import { toFieldErrors } from './gigHelpers';

const digits = (value) => value.replace(/\D/g, '').slice(0, 9);

export default function BidFormCard({ gig, previous, onPlaced }) {
  const [form, setForm] = useState(() => ({
    amount: previous ? String(previous.amount) : '',
    deliveryDays: previous ? String(previous.deliveryDays) : '',
    proposal: previous?.proposal || '',
  }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiFilled, setAiFilled] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === 'proposal' ? value : digits(value) }));
    setFieldErrors((fe) => ({ ...fe, [name]: '' }));
  };

  // Session 15: Gemini writes a draft into the textarea
  const writeWithGemini = async () => {
    setConfirmReplace(false);
    setAiBusy(true);
    setAiError(null);
    try {
      const { data } = await api.post('/ai/proposal', { gigId: gig._id, notes: notes.trim() || undefined });
      setForm((f) => ({ ...f, proposal: data.text.slice(0, 2000) }));
      setFieldErrors((fe) => ({ ...fe, proposal: '' }));
      setAiFilled(true);
    } catch (err) {
      setAiError({ status: err.status, message: err.message });
    } finally {
      setAiBusy(false);
    }
  };

  // A proposal is already typed: ask before replacing it
  const onGemini = () => (form.proposal.trim() ? setConfirmReplace(true) : writeWithGemini());

  const validate = () => {
    const errs = {};
    if (!(Number(form.amount) >= 1)) errs.amount = 'Enter your price in rupees';
    const days = Number(form.deliveryDays);
    if (!(days >= 1 && days <= 365)) errs.deliveryDays = 'Enter between 1 and 365 days';
    const length = form.proposal.trim().length;
    if (length < 30) errs.proposal = `Write at least 30 characters (${30 - length} more)`;
    if (length > 2000) errs.proposal = 'Keep the proposal under 2000 characters';
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
      const { data } = await api.post(`/gigs/${gig._id}/bids`, {
        amount: Number(form.amount),
        deliveryDays: Number(form.deliveryDays),
        proposal: form.proposal.trim(),
      });
      toast.success('Bid sent. The client has been notified');
      onPlaced(data.bid);
    } catch (err) {
      setFieldErrors(toFieldErrors(err.errors));
      setError(err.message);
      toast.error(err.message);
      setSubmitting(false);
    }
  };

  const fieldProps = (name) => ({
    id: `bid-${name}`,
    name,
    value: form[name],
    onChange,
    'aria-invalid': Boolean(fieldErrors[name]),
    'aria-describedby': fieldErrors[name] ? `bid-${name}-error` : undefined,
  });
  const fieldError = (name) =>
    fieldErrors[name] && <p className="gigs-error" id={`bid-${name}-error`}>{fieldErrors[name]}</p>;

  return (
    <Card title="Place a bid" className="gigs-bidform">
      <p className="gigs-note">
        {previous
          ? 'You withdrew your earlier bid. Change anything you like and send it again.'
          : `The client's budget is ${formatINR(gig.budget)}. Bid what the work is worth to you.`}
      </p>

      {error && <div className="gigs-alert gigs-alert--error" role="alert">{error}</div>}

      <form className="gigs-form-stack" onSubmit={onSubmit} noValidate>
        <div className="gigs-form-row">
          <div className="gigs-field">
            <label className="label" htmlFor="bid-amount">Your price (₹)</label>
            <input className="input" inputMode="numeric" placeholder={String(gig.budget)} {...fieldProps('amount')} />
            {fieldError('amount')}
          </div>
          <div className="gigs-field">
            <label className="label" htmlFor="bid-deliveryDays">Delivery time (days)</label>
            <input className="input" inputMode="numeric" placeholder="e.g. 7" {...fieldProps('deliveryDays')} />
            {fieldError('deliveryDays')}
          </div>
        </div>

        <div className="gigs-gemini">
          <p className="gigs-gemini__title">
            <Sparkles size={18} aria-hidden="true" focusable="false" />
            Write your proposal with Gemini
          </p>
          <p className="gigs-hint" id="bid-notes-hint">
            Add a few notes if you like. Gemini drafts a proposal from the gig and your profile, and you edit it before sending.
          </p>
          <div className="gigs-gemini__row">
            <label className="ui-sr-only" htmlFor="bid-notes">Notes for Gemini (optional)</label>
            <input
              id="bid-notes"
              className="input"
              placeholder="Optional: what you'd focus on, tools you'd use"
              value={notes}
              maxLength={500}
              aria-describedby="bid-notes-hint"
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button variant="secondary" icon={Sparkles} loading={aiBusy} loadingText="Writing…" onClick={onGemini}>
              Write with Gemini
            </Button>
          </div>
          <GeminiNotice error={aiError} what="the proposal" />
        </div>

        <div className="gigs-field">
          <div className="gigs-field__top">
            <label className="label" htmlFor="bid-proposal">Proposal</label>
            <span className="counter">{form.proposal.length} / 2000</span>
          </div>
          <textarea
            className="textarea gigs-textarea--tall"
            placeholder="Show you understand the problem, explain how you'd do it, and ask one question."
            maxLength={2000}
            {...fieldProps('proposal')}
          />
          {fieldError('proposal') ||
            (aiFilled && <p className="gigs-hint">Gemini's draft is in. Read it through and make it sound like you before sending.</p>)}
        </div>

        <div className="gigs-card-actions">
          <Button type="submit" icon={Send} loading={submitting} loadingText="Sending…">Send bid</Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmReplace}
        onClose={() => setConfirmReplace(false)}
        onConfirm={writeWithGemini}
        title="Replace your proposal?"
        confirmLabel="Replace with a draft"
      >
        <p>Gemini's draft will replace what you've written in the proposal box.</p>
      </ConfirmDialog>
    </Card>
  );
}
