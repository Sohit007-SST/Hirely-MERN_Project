// LandingIllustration: an original decorative drawing for the landing page - stacked gig cards with budget badges,
// built only from CSS shapes and theme tokens (no images). Hidden from screen readers.
import { Check, IndianRupee } from 'lucide-react';

// One drawn card: avatar dot, two text bars, a budget badge and a row of skill chips
function SketchCard({ amount, tone, className }) {
  return (
    <div className={`home-art__card ${className}`}>
      <div className="home-art__head">
        <span className="home-art__avatar" style={{ background: `var(--cover-${tone})` }} />
        <span className="home-art__lines">
          <span className="home-art__bar home-art__bar--name" />
          <span className="home-art__bar home-art__bar--meta" />
        </span>
      </div>
      <span className="home-art__bar home-art__bar--title" />
      <span className="home-art__bar" />
      <span className="home-art__bar home-art__bar--short" />
      <div className="home-art__foot">
        <span className="home-art__budget">
          <IndianRupee size={14} strokeWidth={2.5} focusable="false" />
          {amount}
        </span>
        <span className="home-art__chip" />
        <span className="home-art__chip home-art__chip--sm" />
      </div>
    </div>
  );
}

export default function LandingIllustration() {
  return (
    <div className="home-art" aria-hidden="true">
      <span className="home-art__blob home-art__blob--a" />
      <span className="home-art__blob home-art__blob--b" />
      <span className="home-art__ring" />
      <SketchCard amount="8,500" tone={2} className="home-art__card--back" />
      <SketchCard amount="15,000" tone={5} className="home-art__card--mid" />
      <SketchCard amount="24,000" tone={1} className="home-art__card--front" />
      <span className="home-art__hired">
        <Check size={14} strokeWidth={3} focusable="false" />
        Hired
      </span>
    </div>
  );
}
