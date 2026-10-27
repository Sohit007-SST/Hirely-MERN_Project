// GigPost: one open gig shown as a feed post - client header, title, description, skills, budget line, counts and an action bar.
// Props: { gig } (one item of GET /gigs: client populated 'name avatar rating', likes = user ids, bidsCount)
import { memo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Clock, Copy, Flag, Gavel, MoreHorizontal } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Avatar, BudgetBadge, Button, Dropdown, SeeMore } from '../ui';
import { formatDate, plural, sameId, timeAgo } from '../../utils/format';
import GigPostActions from './GigPostActions';

// "2h" style short age for the post header
function shortAge(date) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (!Number.isFinite(mins)) return '';
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  if (mins < 10080) return `${Math.floor(mins / 1440)}d`;
  return `${Math.floor(mins / 10080)}w`;
}

function GigPost({ gig }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const client = gig.client || {};
  const gigUrl = `/gigs/${gig._id}`;
  const titleId = `gigpost-${gig._id}`;

  // Save = the like API; the response gives the new state, so the post updates in place
  const [liked, setLiked] = useState(() => Boolean(user) && (gig.likes || []).some((id) => sameId(id, user._id)));
  const [likesCount, setLikesCount] = useState((gig.likes || []).length);
  const [saving, setSaving] = useState(false);
  const [messaging, setMessaging] = useState(false);

  const isOwner = Boolean(user) && sameId(client, user._id);
  const toLogin = () => navigate('/login', { state: { from: location } });

  const toggleSave = async () => {
    if (!user) return toLogin();
    setSaving(true);
    try {
      const { data } = await api.post(`/gigs/${gig._id}/like`);
      setLiked(data.liked);
      setLikesCount(data.likesCount);
      toast.success(data.liked ? 'Gig saved' : 'Removed from saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Opens (or reuses) the chat with this gig's client, then jumps into it
  const message = async () => {
    if (!user) return toLogin();
    setMessaging(true);
    try {
      const { data } = await api.post('/chat/conversations', { userId: client._id, gigId: gig._id });
      navigate(`/chat/${data.conversation._id}`);
    } catch (err) {
      toast.error(err.message);
      setMessaging(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${gigUrl}`);
      toast.success('Link copied');
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <article className="ui-card home-post" aria-labelledby={titleId}>
      <header className="home-post__head">
        <Link to={`/users/${client._id}`} className="home-post__avatar" tabIndex={-1} aria-hidden="true">
          <Avatar user={client} size={48} decorative />
        </Link>
        <div className="home-post__who">
          <Link to={`/users/${client._id}`} className="home-post__name">{client.name || 'Client'}</Link>
          <span className="home-post__headline">{client.headline || 'Client'}</span>
          <span className="home-post__meta">
            <time dateTime={gig.createdAt} title={timeAgo(gig.createdAt)}>{shortAge(gig.createdAt)}</time>
            {' · '}
            {gig.category}
          </span>
        </div>
        <Dropdown
          align="end"
          label="Post actions"
          trigger={<Button variant="tertiary" size="sm" icon={MoreHorizontal} aria-label={`More actions for ${gig.title}`} />}
          items={[
            { label: 'Copy link', icon: Copy, onClick: copyLink },
            { label: 'Report', icon: Flag, onClick: () => toast('Thanks. Reporting is coming soon.') },
          ]}
        />
      </header>

      <div className="home-post__body">
        <h3 id={titleId} className="home-post__title">
          <Link to={gigUrl}>{gig.title}</Link>
        </h3>
        <SeeMore className="home-post__desc">{gig.description}</SeeMore>
        {gig.skills?.length > 0 && (
          <ul className="home-post__skills" aria-label="Skills">
            {gig.skills.map((s) => (
              <li key={s} className="home-chip">{s}</li>
            ))}
          </ul>
        )}
        <div className="home-post__facts">
          <BudgetBadge amount={gig.budget} size="md" label="Budget" />
          {gig.deadline && (
            <span className="home-post__fact">
              <Clock size={16} aria-hidden="true" focusable="false" />
              Due {formatDate(gig.deadline)}
            </span>
          )}
          <span className="home-post__fact">
            <Gavel size={16} aria-hidden="true" focusable="false" />
            {plural(gig.bidsCount, 'bid')}
          </span>
        </div>
      </div>

      <p className="home-post__social">
        {likesCount} saved · {plural(gig.bidsCount, 'bid')}
      </p>

      <GigPostActions
        gigUrl={gigUrl}
        role={user?.role}
        isOwner={isOwner}
        liked={liked}
        saving={saving}
        messaging={messaging}
        onSave={toggleSave}
        onMessage={message}
      />
    </article>
  );
}

export default memo(GigPost);
