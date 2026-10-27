// ProfileActions: the profile's action row - Follow + Message + More for other people, Edit profile + More for me,
// and "Log in to follow" for visitors. Follow uses POST /users/:id/follow; Message opens (or creates) the chat.
// Props: { profile, isMe: boolean, following: boolean (server's isFollowing), onFollowChange: ({ following, followersCount }) => void }
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronDown, Link2, MessageSquare, Pencil } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Button, Dropdown } from '../ui';
import FollowButton from './FollowButton';
import useFollow from './useFollow';

function MoreMenu() {
  const copyLink = () => {
    const url = window.location.href;
    if (!navigator.clipboard) {
      toast.error("Couldn't copy the link. Copy it from the address bar.");
      return;
    }
    navigator.clipboard.writeText(url).then(
      () => toast.success('Profile link copied'),
      () => toast.error("Couldn't copy the link. Copy it from the address bar.")
    );
  };

  return (
    <Dropdown
      label="More profile actions"
      trigger={<Button variant="secondary" iconRight={ChevronDown}>More</Button>}
      items={[{ label: 'Copy profile link', icon: Link2, onClick: copyLink }]}
    />
  );
}

export default function ProfileActions({ profile, isMe, following, onFollowChange }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [messageBusy, setMessageBusy] = useState(false);
  const { busy, toggle } = useFollow(profile, { onChange: onFollowChange });

  // Find or create the private conversation, then open it
  const startChat = async () => {
    setMessageBusy(true);
    try {
      const { data } = await api.post('/chat/conversations', { userId: profile._id });
      navigate(`/chat/${data.conversation._id}`);
    } catch (err) {
      toast.error(err.message);
      setMessageBusy(false);
    }
  };

  let main;
  if (isMe) {
    main = <Button icon={Pencil} to="/settings">Edit profile</Button>;
  } else if (!user) {
    main = <Button to="/login" state={{ from: location }}>Log in to follow</Button>;
  } else {
    main = (
      <>
        <FollowButton person={profile} following={following} busy={busy} onToggle={toggle} variant="primary" size="md" />
        <Button
          variant="secondary"
          icon={MessageSquare}
          onClick={startChat}
          loading={messageBusy}
          loadingText="Opening chat…"
          aria-label={`Message ${profile.name}`}
        >
          Message
        </Button>
      </>
    );
  }

  return (
    <div className="people-top__actions">
      {main}
      <MoreMenu />
    </div>
  );
}
