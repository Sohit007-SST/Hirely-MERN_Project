// AuthCard: the centred 400px card used by Sign in and Join - a 32px title, a grey subtitle, the form,
// an "or" divider and a full-width secondary pill to the other page. (The shell already draws the logo.)
// Props: { title: string, subtitle: string, children (the form), altText: string, altTo: string, altState?: object }
import { Button, Skeleton } from '../ui';

export default function AuthCard({ title, subtitle, children, altText, altTo, altState }) {
  return (
    <div className="rest-auth">
      <section className="rest-auth__card" aria-labelledby="auth-title">
        <h1 id="auth-title" className="rest-auth__title">
          {title}
        </h1>
        <p className="rest-auth__sub">{subtitle}</p>
        {children}
        <div className="rest-auth__or" aria-hidden="true">
          <span>or</span>
        </div>
        <Button variant="secondary" block className="rest-auth__btn" to={altTo} state={altState}>
          {altText}
        </Button>
      </section>
    </div>
  );
}

// Same card in grey while the saved session is being checked
export function AuthCardSkeleton() {
  return (
    <div className="rest-auth" role="status" aria-busy="true">
      <span className="ui-sr-only">Loading…</span>
      <div className="rest-auth__card rest-auth__card--skeleton" aria-hidden="true">
        <Skeleton width="55%" height={32} />
        <Skeleton width="80%" />
        <Skeleton shape="rect" width="100%" height={52} />
        <Skeleton shape="rect" width="100%" height={52} />
        <Skeleton shape="pill" width="100%" height={48} />
      </div>
    </div>
  );
}
