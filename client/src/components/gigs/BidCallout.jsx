// BidCallout: what sits in the bid spot when the viewer can't bid - logged out ("Log in to bid"), another client,
// or a freelancer on a gig that is no longer open.
// Props: { kind: 'guest'|'client'|'closed' }
import { Link, useLocation } from 'react-router-dom';
import { Send, UserPlus } from 'lucide-react';
import { Button, Card } from '../ui';

export default function BidCallout({ kind }) {
  const location = useLocation();

  if (kind === 'guest') {
    return (
      <Card id="bid" className="gigs-anchor gigs-callout" title="Want to work on this?">
        <p className="gigs-note">Log in with a freelancer account to send a price, a delivery time and your plan.</p>
        <div className="gigs-card-actions gigs-card-actions--start">
          <Button to="/login" state={{ from: location }} icon={Send}>Log in to bid</Button>
          <Button variant="secondary" to="/register?role=freelancer" state={{ from: location }} icon={UserPlus}>
            Create a freelancer account
          </Button>
        </div>
      </Card>
    );
  }

  if (kind === 'client') {
    return (
      <Card id="bid" className="gigs-anchor gigs-callout">
        <p className="gigs-note">You're logged in as a client, so you can't bid. Only freelancer accounts can send bids.</p>
      </Card>
    );
  }

  return (
    <Card id="bid" className="gigs-anchor gigs-callout">
      <p className="gigs-note">
        This gig isn't taking bids any more. <Link className="gigs-link" to="/gigs">Find open gigs</Link>
      </p>
    </Card>
  );
}
