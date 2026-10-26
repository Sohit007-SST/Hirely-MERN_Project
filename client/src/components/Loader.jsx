// Props: { full?: boolean (fills the page area), label?: string = 'Loading' }
// Deliberately static: the home board is the app's only animation.
export default function Loader({ full = false, label = 'Loading' }) {
  return (
    <div className={`loader${full ? ' loader--full' : ''}`} role="status" aria-live="polite">
      <span className="loader__tag" aria-hidden="true" />
      <span className="loader__label">{label}…</span>
    </div>
  );
}
