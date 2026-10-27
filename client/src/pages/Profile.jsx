import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { UserX } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Layout from '../components/shell/Layout';
import { Button, Card, EmptyState, SkeletonProfile, SkeletonRow } from '../components/ui';
import {
  AboutCard,
  ActivityCard,
  EditIntroModal,
  HourlyRateCard,
  PeopleYouMayKnow,
  ProfileTopCard,
  ReviewsCard,
  SkillsCard,
} from '../components/people';
import { sameId } from '../utils/format';

// Fields the Edit intro form can change; copied into the profile on screen after a save or photo upload
const EDITABLE = ['name', 'headline', 'bio', 'location', 'skills', 'hourlyRate', 'avatar'];

// Right rail while the profile loads
function RailSkeleton() {
  return (
    <Card title="People you may know">
      <SkeletonRow count={3} label="Loading suggestions" />
    </Card>
  );
}

export default function Profile() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const { isOnline } = useSocket();

  const [data, setData] = useState(null); // { user, counts, isFollowing, stats }
  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const meId = me?._id;

  // Reload when the profile changes, or when I log in/out (isFollowing depends on who asks)
  const load = useCallback(
    (signal) => {
      setStatus('loading');
      api
        .get(`/users/${id}`, { signal })
        .then(({ data: res }) => {
          setData(res);
          setStatus('ready');
        })
        .catch((err) => {
          if (signal?.aborted) return;
          setError(err.message);
          setStatus(err.status === 404 || err.status === 400 ? 'notfound' : 'error');
        });
    },
    [id, meId]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // Follow / unfollow (ProfileActions) → new follower count from the server
  const onFollowChange = useCallback(({ following, followersCount }) => {
    setData((d) => ({ ...d, isFollowing: following, counts: { ...d.counts, followers: followersCount } }));
  }, []);

  // Edit intro saved (or a new photo uploaded): show the new details without a reload
  const onProfileSaved = useCallback((updated) => {
    setData((d) => {
      if (!d || !sameId(d.user._id, updated._id)) return d;
      const changes = Object.fromEntries(EDITABLE.map((key) => [key, updated[key]]));
      return { ...d, user: { ...d.user, ...changes } };
    });
  }, []);

  // Keep the page on screen while refreshing the same profile (e.g. right after logging in)
  if (status === 'loading' && !sameId(data?.user?._id, id)) {
    return (
      <Layout variant="two-right" right={<RailSkeleton />} className="people-profile">
        <SkeletonProfile label="Loading profile" />
        <Card title="About">
          <SkeletonRow count={1} label="Loading" />
        </Card>
      </Layout>
    );
  }

  if (status === 'notfound') {
    return (
      <Layout>
        <EmptyState
          icon={UserX}
          title="We couldn't find this person"
          text="The account may have been removed or suspended, or the link is mistyped. Browse freelancers to find someone else."
          action={<Button to="/freelancers">Browse freelancers</Button>}
        />
      </Layout>
    );
  }

  if (status === 'error') {
    return (
      <Layout>
        <Card title="Couldn't load this profile">
          <div className="people-empty-line" role="alert">
            <p className="people-error">{error}</p>
            <Button size="sm" variant="secondary" onClick={() => load()}>Try again</Button>
          </div>
        </Card>
      </Layout>
    );
  }

  const { user: profile, counts, isFollowing, stats } = data;
  const isMe = sameId(profile._id, meId);
  const firstName = profile.name.split(' ')[0];
  const openEdit = () => setEditing(true);

  const rail = (
    <>
      <HourlyRateCard profile={profile} isMe={isMe} onEdit={openEdit} />
      <PeopleYouMayKnow excludeId={profile._id} />
    </>
  );

  return (
    <Layout variant="two-right" right={rail} className="people-profile">
      <ProfileTopCard
        profile={profile}
        counts={counts}
        isFollowing={isFollowing}
        isMe={isMe}
        online={isOnline(profile._id)}
        onEdit={openEdit}
        onFollowChange={onFollowChange}
      />
      <AboutCard profile={profile} isMe={isMe} onEdit={openEdit} />
      <SkillsCard profile={profile} isMe={isMe} onEdit={openEdit} />
      <ActivityCard profile={profile} stats={stats} isMe={isMe} />
      <ReviewsCard userId={profile._id} firstName={firstName} />

      {isMe && <EditIntroModal open={editing} onClose={() => setEditing(false)} onSaved={onProfileSaved} />}
    </Layout>
  );
}
