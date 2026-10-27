// HiredCard: right-rail card naming the freelancer who was hired for this gig (shown once the gig is assigned).
// Props: { freelancer }
import { Link } from 'react-router-dom';
import { Avatar, Card, StarRating } from '../ui';

export default function HiredCard({ freelancer }) {
  return (
    <Card title="Hired freelancer" className="gigs-hired">
      <div className="gigs-hired__row">
        <Avatar user={freelancer} size={48} decorative />
        <div className="gigs-hired__who">
          <Link className="gigs-hired__name" to={`/users/${freelancer._id}`}>{freelancer.name}</Link>
          {freelancer.headline && <span className="gigs-hired__headline">{freelancer.headline}</span>}
          <StarRating value={freelancer.rating?.average} count={freelancer.rating?.count || 0} size="sm" />
        </div>
      </div>
    </Card>
  );
}
