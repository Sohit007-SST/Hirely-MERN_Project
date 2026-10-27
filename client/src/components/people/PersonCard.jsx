// PersonCard: a people-grid card on the Network page - Cover, 104px Avatar (online dot), name, headline, rating, skills,
// hourly rate and a full-width Follow pill. The whole card opens the profile (stretched name link).
// Props: { person (from GET /users/freelancers), online: boolean }
import { memo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Cover, StarRating } from '../ui';
import { formatINR, sameId } from '../../utils/format';
import FollowButton from './FollowButton';
import useFollow from './useFollow';

function CardFollow({ person }) {
  const { user } = useAuth();
  const { following, busy, toggle } = useFollow(person);
  if (sameId(user?._id, person._id)) {
    return <p className="people-card__you">This is you</p>;
  }
  return <FollowButton person={person} following={following} busy={busy} onToggle={toggle} block className="people-card__action" />;
}

// Session 14: memo - a card re-renders only when its freelancer or online state changes (or my follow list)
const PersonCard = memo(function PersonCard({ person, online }) {
  const skills = person.skills || [];

  return (
    <article className="ui-card people-card">
      <Cover id={person._id} height={56} />
      <div className="people-card__body">
        <Avatar user={person} size={104} ring online={online} className="people-card__avatar" />
        <h3 className="people-card__name">
          <Link to={`/users/${person._id}`} className="people-card__link">{person.name}</Link>
        </h3>
        <p className="people-card__headline">{person.headline || 'Freelancer on Hirely'}</p>
        <div className="people-card__rating">
          <StarRating value={person.rating?.average} count={person.rating?.count ?? 0} size="sm" />
        </div>
        {skills.length > 0 && (
          <p className="people-card__skills">
            <span className="ui-sr-only">Skills: </span>
            {skills.join(' · ')}
          </p>
        )}
        <p className="people-card__rate">
          {person.hourlyRate > 0 ? (
            <>
              <strong>{formatINR(person.hourlyRate)}</strong>/hr
            </>
          ) : (
            <span className="people-card__rate-none">Rate not set</span>
          )}
        </p>
      </div>
      <div className="people-card__foot">
        <CardFollow person={person} />
      </div>
    </article>
  );
});

export default PersonCard;
