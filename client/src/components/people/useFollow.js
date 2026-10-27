// useFollow: the follow / unfollow toggle for one person (POST /users/:id/follow → { following, followersCount }).
// It also keeps the signed-in user's `following` id list (from /auth/me) in sync, so every Follow button on screen agrees.
// Usage: const { following, busy, toggle } = useFollow(person, { onChange: ({ following, followersCount }) => … })
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { sameId } from '../../utils/format';

export default function useFollow(person, { onChange } = {}) {
  const { user, setUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const following = (user?.following || []).some((id) => sameId(id, person._id));

  // Session 10: follow / unfollow toggle
  const toggle = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/users/${person._id}/follow`);
      setUser((u) => {
        if (!u) return u;
        const rest = (u.following || []).filter((id) => !sameId(id, person._id));
        return { ...u, following: data.following ? [...rest, person._id] : rest };
      });
      onChange?.(data);
      const first = person.name.split(' ')[0];
      toast.success(data.following ? `You're following ${first}` : `You unfollowed ${first}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return { following, busy, toggle };
}
