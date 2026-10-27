// useGigSave: the Save (like) toggle for one gig. Logged-out users are sent to /login and come back afterwards.
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { sameId } from '../../utils/format';

// gig: the loaded gig; setGig: its state setter (likes are updated in place)
export default function useGigSave(gig, setGig, user) {
  const navigate = useNavigate();
  const location = useLocation();
  const [saving, setSaving] = useState(false);
  const likes = gig?.likes || [];
  const saved = Boolean(user && likes.some((l) => sameId(l, user)));

  // Session 11: save (like) toggle
  const toggleSave = async () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post(`/gigs/${gig._id}/like`);
      setGig((g) => ({
        ...g,
        likes: data.liked ? [...(g.likes || []), user._id] : (g.likes || []).filter((l) => !sameId(l, user)),
      }));
      toast.success(data.liked ? 'Saved' : 'Removed from saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return { saved, saveCount: likes.length, saving, toggleSave };
}
