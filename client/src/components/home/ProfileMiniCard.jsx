// ProfileMiniCard: the left-rail card on the home feed - my cover, avatar, name, headline, two stats and a "Saved gigs" row.
// Props: { user } (the logged-in user from useAuth)
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import api from '../../api/axios';
import { Avatar, Cover, Skeleton } from '../ui';

const ROLE_LABEL = { client: 'Client', freelancer: 'Freelancer', admin: 'Admin' };

// Second stat depends on the role (GET /users/:id `stats`)
function secondStat(role, stats) {
  if (role === 'client') return { label: 'Gigs posted', value: stats?.gigsPosted };
  if (role === 'freelancer') return { label: 'Gigs completed', value: stats?.gigsCompleted };
  return null;
}

function StatRow({ to, label, value }) {
  return (
    <Link to={to} className="home-mini__stat">
      <span>{label}</span>
      {value == null ? <Skeleton width={24} height={14} /> : <strong className="home-mini__value">{value}</strong>}
    </Link>
  );
}

export default function ProfileMiniCard({ user }) {
  const [profile, setProfile] = useState(null);
  const profileUrl = `/users/${user._id}`;

  // GET /users/:id gives the follower count and the role's gig stat
  useEffect(() => {
    const controller = new AbortController();
    api
      .get(`/users/${user._id}`, { signal: controller.signal })
      .then(({ data }) => setProfile(data))
      .catch(() => {
        if (!controller.signal.aborted) setProfile({ counts: { followers: '–' }, stats: { gigsPosted: '–', gigsCompleted: '–' } });
      });
    return () => controller.abort();
  }, [user._id]);

  const extra = secondStat(user.role, profile?.stats);

  return (
    <section className="ui-card home-mini" aria-label="Your profile">
      <Cover id={user._id} height={56} />
      <div className="home-mini__id">
        <Link to={profileUrl} className="home-mini__avatar" tabIndex={-1} aria-hidden="true">
          <Avatar user={user} size={72} ring decorative />
        </Link>
        <Link to={profileUrl} className="home-mini__name">{user.name}</Link>
        <p className="home-mini__headline">{user.headline || ROLE_LABEL[user.role]}</p>
      </div>
      <div className="home-mini__stats">
        <StatRow to={profileUrl} label="Followers" value={profile?.counts?.followers} />
        {extra && <StatRow to="/dashboard" label={extra.label} value={extra.value ?? (profile ? 0 : null)} />}
      </div>
      <Link to="/dashboard" className="home-mini__saved">
        <Bookmark size={16} aria-hidden="true" focusable="false" />
        Saved gigs
      </Link>
    </section>
  );
}
