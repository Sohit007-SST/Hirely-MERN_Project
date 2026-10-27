// FollowButton: "+ Follow" pill that switches to "✓ Following"; visitors get a link to sign in first.
// Props: { person: { _id, name }, following: boolean, busy?: boolean, onToggle: () => void,
//          variant?: 'primary'|'secondary' = 'secondary' (the "not following" look; "Following" is always secondary),
//          size?: 'sm'|'md' = 'sm', block?: boolean, className? }
import { useLocation } from 'react-router-dom';
import { Check, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui';

export default function FollowButton({ person, following, busy = false, onToggle, variant = 'secondary', size = 'sm', block = false, className = '' }) {
  const { user } = useAuth();
  const location = useLocation();
  const first = person.name.split(' ')[0];

  if (!user) {
    return (
      <Button
        variant={variant}
        size={size}
        block={block}
        icon={Plus}
        to="/login"
        state={{ from: location }}
        className={className}
        aria-label={`Log in to follow ${person.name}`}
      >
        Follow
      </Button>
    );
  }

  return (
    <Button
      variant={following ? 'secondary' : variant}
      size={size}
      block={block}
      icon={following ? Check : Plus}
      aria-pressed={following}
      aria-label={following ? `Following ${person.name}. Select to unfollow` : `Follow ${person.name}`}
      title={following ? `Unfollow ${first}` : undefined}
      loading={busy}
      onClick={onToggle}
      className={className}
    >
      {following ? 'Following' : 'Follow'}
    </Button>
  );
}
