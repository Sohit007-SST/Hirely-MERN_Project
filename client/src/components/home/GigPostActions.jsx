// GigPostActions: the equal-width action bar under a feed post (Save, Comment, Bid or View bids, Message).
// Props: { gigUrl, role?: 'client'|'freelancer'|'admin', isOwner, liked, saving, messaging, onSave(), onMessage() }
import { Bookmark, Gavel, ListChecks, MessageCircle, Send } from 'lucide-react';
import { Button } from '../ui';

export default function GigPostActions({ gigUrl, role, isOwner, liked, saving, messaging, onSave, onMessage }) {
  return (
    <div className="home-post__actions" role="group" aria-label="Post actions">
      <Button
        variant="tertiary"
        icon={<Bookmark size={18} fill={liked ? 'currentColor' : 'none'} aria-hidden="true" focusable="false" />}
        className={liked ? 'is-saved' : ''}
        aria-pressed={liked}
        loading={saving}
        loadingText={liked ? 'Saved' : 'Save'}
        onClick={onSave}
      >
        {liked ? 'Saved' : 'Save'}
      </Button>

      <Button variant="tertiary" icon={MessageCircle} to={`${gigUrl}#qa`}>
        Comment
      </Button>

      {isOwner ? (
        <Button variant="tertiary" icon={ListChecks} to={`${gigUrl}#bids`}>
          View bids
        </Button>
      ) : (
        role === 'freelancer' && (
          <Button variant="tertiary" icon={Gavel} to={`${gigUrl}#bid`}>
            Bid
          </Button>
        )
      )}

      {!isOwner && (
        <Button variant="tertiary" icon={Send} loading={messaging} loadingText="Opening…" onClick={onMessage}>
          Message
        </Button>
      )}
    </div>
  );
}
