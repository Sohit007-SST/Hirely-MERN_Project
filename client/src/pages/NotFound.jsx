import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';

export default function NotFound() {
  return (
    <div className="container page">
      <EmptyState
        title="We couldn't find that page"
        text="The link may be old or mistyped. Head back home or look through the open gigs."
        action={
          <>
            <Link className="btn btn--primary" to="/">Go to the home page</Link>
            <Link className="btn btn--secondary" to="/gigs">Browse gigs</Link>
          </>
        }
      />
    </div>
  );
}
