// FreelancersToFollow: right-rail card suggesting 3 freelancers (not me), each with a "+ Follow" pill that toggles to "Following".
// Props: none (reads the logged-in user from useAuth)
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Check, Plus } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Avatar, Button, Card, SkeletonRow } from '../ui';
import { sameId } from '../../utils/format';

const SHOW = 3;

// One suggestion row: avatar, name, headline, follow pill
function FollowRow({ person, following, busy, onToggle }) {
  return (
    <li className="home-follow__row">
      <Link to={`/users/${person._id}`} className="home-follow__avatar" tabIndex={-1} aria-hidden="true">
        <Avatar user={person} size={48} decorative />
      </Link>
      <div className="home-follow__info">
        <Link to={`/users/${person._id}`} className="home-follow__name">{person.name}</Link>
        <span className="home-follow__headline">{person.headline || 'Freelancer'}</span>
        <Button
          variant="secondary"
          size="sm"
          icon={following ? Check : Plus}
          loading={busy}
          aria-label={`${following ? 'Following' : 'Follow'} ${person.name}`}
          onClick={onToggle}
        >
          {following ? 'Following' : 'Follow'}
        </Button>
      </div>
    </li>
  );
}

export default function FreelancersToFollow() {
  const { user, setUser } = useAuth();
  const [people, setPeople] = useState(null); // null = loading
  const [failed, setFailed] = useState(false);
  const [following, setFollowing] = useState({}); // id -> boolean
  const [busyId, setBusyId] = useState('');

  // GET /users/freelancers (top rated first); skip me and show people I don't follow yet first
  useEffect(() => {
    const controller = new AbortController();
    const mine = new Set((user.following || []).map(String));
    api
      .get('/users/freelancers', { params: { limit: 12 }, signal: controller.signal })
      .then(({ data }) => {
        const others = data.users.filter((p) => !sameId(p, user._id));
        const ordered = [...others.filter((p) => !mine.has(String(p._id))), ...others.filter((p) => mine.has(String(p._id)))];
        const picked = ordered.slice(0, SHOW);
        setFollowing(Object.fromEntries(picked.map((p) => [p._id, mine.has(String(p._id))])));
        setPeople(picked);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
    // Only on mount / account change (user.following is read once): following someone must not reshuffle the list
  }, [user._id]);

  // POST /users/:id/follow toggles and returns the new state
  const toggle = async (person) => {
    setBusyId(person._id);
    try {
      const { data } = await api.post(`/users/${person._id}/follow`);
      setFollowing((f) => ({ ...f, [person._id]: data.following }));
      // Keep my own "following" list in step so the next visit suggests new people
      setUser((u) =>
        u && {
          ...u,
          following: data.following
            ? [...(u.following || []), person._id]
            : (u.following || []).filter((id) => !sameId(id, person._id)),
        }
      );
      const first = person.name.split(' ')[0];
      toast.success(data.following ? `You're following ${first}` : `You unfollowed ${first}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId('');
    }
  };

  return (
    <Card title="Freelancers to follow" titleAs="h2" className="home-follow" padded footerTo="/freelancers" footerLabel="View all recommendations">
      {failed ? (
        <p className="home-rail-note">Couldn't load suggestions right now.</p>
      ) : people == null ? (
        <SkeletonRow count={SHOW} label="Loading suggestions" />
      ) : people.length === 0 ? (
        <p className="home-rail-note">No freelancers to suggest yet.</p>
      ) : (
        <ul className="home-follow__list">
          {people.map((p) => (
            <FollowRow key={p._id} person={p} following={Boolean(following[p._id])} busy={busyId === p._id} onToggle={() => toggle(p)} />
          ))}
        </ul>
      )}
    </Card>
  );
}
