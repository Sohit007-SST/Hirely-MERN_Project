// GeminiNotice: how a failed Gemini call is shown - "not set up" (503) as a calm info box, anything else as red text.
// Props: { error: { status, message } | null, what: string (what the user can still write themselves, e.g. "the proposal") }
import { Info } from 'lucide-react';

export default function GeminiNotice({ error, what }) {
  if (!error) return null;
  if (error.status === 503) {
    return (
      <div className="gigs-alert gigs-alert--info" role="status">
        <Info size={18} aria-hidden="true" focusable="false" />
        <span>
          <strong>Gemini isn't set up on this server yet.</strong> You can still write {what} yourself.
        </span>
      </div>
    );
  }
  return <p className="gigs-error" role="alert">{error.message}</p>;
}
