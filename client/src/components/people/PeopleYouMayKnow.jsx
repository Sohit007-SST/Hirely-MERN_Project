// PeopleYouMayKnow: right-rail card with 3 top freelancers (not me, not the profile being viewed), each with a Follow pill.
// Props: { excludeId?: string (the profile on screen) }
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Card, SkeletonRow } from '../ui';
import { sameId } from '../../utils/format';
import FollowButton from './FollowButton';
import useFollow from './useFollow';

const SHOWN = 3;

function SuggestionRow({ person }) {
  const { following, busy, toggle } = useFollow(person);
  return (
    <li className="people-suggest">
      <Link to={`/users/${person._id}`} className="people-suggest__avatar" tabIndex={-1} aria-hidden="true">
        <Avatar user={person} size={48} decorative />
      </Link>
      <div className="people-suggest__main">
        <Link className="people-suggest__name" to={`/users/${person._id}`}>{person.name}</Link>
        {person.headline && <p className="people-suggest__headline">{person.headline}</p>}
        <FollowButton person={person} following={following} busy={busy} onToggle={toggle} className="people-suggest__follow" />
      </div>
    </li>
  );
}

export default function PeopleYouMayKnow({ excludeId }) {
  const { user } = useAuth();
  const meId = user?._id;
  const [people, setPeople] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setFailed(false);
    api
      .get('/users/freelancers', { params: { limit: SHOWN + 2 }, signal: controller.signal })
      .then(({ data }) =>
        setPeople(data.users.filter((u) => !sameId(u._id, meId) && !sameId(u._id, excludeId)).slice(0, SHOWN))
      )
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [meId, excludeId]);

  if (failed || (people && people.length === 0)) return null;

  return (
    <Card title="People you may know" titleAs="h2" footerTo="/freelancers" footerLabel="Show all">
      {people ? (
        <ul className="people-suggest-list">
          {people.map((p) => (
            <SuggestionRow key={p._id} person={p} />
          ))}
        </ul>
      ) : (
        <SkeletonRow count={SHOWN} label="Loading suggestions" />
      )}
    </Card>
  );
}
