// ClientCard: "Meet the client" in the gig page's right rail - Cover, avatar overlapping it, name, headline, rating,
// location and join date, a "Message" pill (opens the chat) and a "View profile" link.
// Props: { client, isOwner, user, authLoading, busy, onMessage() }
import { Link, useLocation } from 'react-router-dom';
import { MapPin, MessageSquare } from 'lucide-react';
import { Avatar, Button, Cover, StarRating } from '../ui';
import { memberSince } from './gigHelpers';

export default function ClientCard({ client, isOwner, user, authLoading, busy, onMessage }) {
  const location = useLocation();
  return (
    <section className="ui-card gigs-person" aria-labelledby="client-card-title">
      <Cover id={client._id} height={56} />
      <div className="gigs-person__body">
        <Avatar user={client} size={72} ring decorative className="gigs-person__avatar" />
        <p className="gigs-person__eyebrow" id="client-card-title">{isOwner ? 'You posted this gig' : 'Meet the client'}</p>
        <Link className="gigs-person__name" to={`/users/${client._id}`}>{client.name}</Link>
        {client.headline && <p className="gigs-person__headline">{client.headline}</p>}
        <StarRating value={client.rating?.average} count={client.rating?.count || 0} size="sm" />
        {(client.location || client.createdAt) && (
          <p className="gigs-person__meta">
            {client.location && (
              <span><MapPin size={16} aria-hidden="true" focusable="false" />{client.location}</span>
            )}
            {client.createdAt && <span>Member since {memberSince(client.createdAt)}</span>}
          </p>
        )}
        <div className="gigs-person__actions">
          {!isOwner && user && (
            <Button variant="secondary" icon={MessageSquare} block loading={busy} loadingText="Opening chat…" onClick={onMessage}>
              Message
            </Button>
          )}
          {!user && !authLoading && (
            <Button variant="secondary" icon={MessageSquare} block to="/login" state={{ from: location }}>
              Log in to message
            </Button>
          )}
          <Link className="gigs-person__link" to={`/users/${client._id}`}>View profile</Link>
        </div>
      </div>
    </section>
  );
}
