// ProfileTopCard: the profile header - 200px Cover, 152px Avatar overlapping it, name, headline, location and join date,
// "N followers · M following", rating and the action row. On your own profile: a Camera link and an Edit intro Pencil.
// Props: { profile, counts: { followers, following }, isFollowing, isMe, online, onEdit: () => void, onFollowChange }
import { Link } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { Avatar, Cover, StarRating, StatusPill } from '../ui';
import { plural } from '../../utils/format';
import EditPencil from './EditPencil';
import ProfileActions from './ProfileActions';

const ROLE_LABEL = { client: 'Client', freelancer: 'Freelancer', admin: 'Admin' };

// "Oct 2026"
const monthYear = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '';

export default function ProfileTopCard({ profile, counts, isFollowing, isMe, online, onEdit, onFollowChange }) {
  const meta = [ROLE_LABEL[profile.role] || profile.role, profile.location, `Joined ${monthYear(profile.createdAt)}`].filter(Boolean);

  return (
    <section className="ui-card people-top" aria-labelledby="profile-name">
      <Cover id={profile._id} height={200} className="people-top__cover">
        {isMe && (
          <Link className="people-top__camera" to="/settings" aria-label="Change your profile photo" title="Change your profile photo">
            <Camera size={18} aria-hidden="true" focusable="false" />
          </Link>
        )}
      </Cover>

      <div className="people-top__body">
        <div className="people-top__head">
          <Avatar user={profile} size={152} ring online={online} className="people-top__avatar" />
          {isMe && <EditPencil label="Edit intro" onClick={onEdit} className="people-top__edit" />}
        </div>

        <div className="people-top__titles">
          <h1 id="profile-name" className="people-top__name">{profile.name}</h1>
          {profile.isBanned && <StatusPill status="suspended" />}
        </div>
        {profile.headline && <p className="people-top__headline">{profile.headline}</p>}

        <p className="people-top__meta">
          {meta.join(' · ')}
          {online && <span className="people-top__online"> · Online now</span>}
        </p>
        <p className="people-top__counts">
          {plural(counts.followers, 'follower')} · {counts.following} following
        </p>

        {profile.role !== 'admin' && (
          <div className="people-top__rating">
            <StarRating value={profile.rating?.average} count={profile.rating?.count ?? 0} size="sm" />
          </div>
        )}

        <ProfileActions profile={profile} isMe={isMe} following={isFollowing} onFollowChange={onFollowChange} />
      </div>
    </section>
  );
}
