// ManageNetworkCard: Network page left rail - my Following and Followers counts (GET /users/<me>) and a link to my profile.
// The counts are fetched again whenever I follow or unfollow someone (my `following` list changes length).
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, Users } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Card, Skeleton } from '../ui';

function CountRow({ icon: Icon, label, value, to }) {
  return (
    <li>
      <Link className="people-manage__row" to={to}>
        <Icon size={18} aria-hidden="true" focusable="false" />
        <span className="people-manage__label">{label}</span>
        <span className="people-manage__value">
          {value == null ? <Skeleton width={24} /> : value}
        </span>
      </Link>
    </li>
  );
}

export default function ManageNetworkCard() {
  const { user } = useAuth();
  const followingLength = user.following?.length;
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get(`/users/${user._id}`, { signal: controller.signal })
      .then(({ data }) => setCounts(data.counts))
      .catch(() => {
        if (!controller.signal.aborted) setCounts({ followers: '–', following: followingLength ?? '–' });
      });
    return () => controller.abort();
  }, [user._id, followingLength]);

  const profileLink = `/users/${user._id}`;

  return (
    <Card title="Manage my network" padded={false} footerTo={profileLink} footerLabel="View my profile" className="people-manage">
      <ul className="people-manage__list">
        <CountRow icon={UserCheck} label="Following" value={counts?.following} to={profileLink} />
        <CountRow icon={Users} label="Followers" value={counts?.followers} to={profileLink} />
      </ul>
    </Card>
  );
}
