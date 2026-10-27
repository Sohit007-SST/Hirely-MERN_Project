// ConversationRow: one conversation in the list - avatar with online dot, name, date, last message, gig tag, unread badge.
// Unread rows have a bold name and preview; the selected row gets a teal left bar and a soft teal background.
// Props: { conversation, meId, active: boolean, online: boolean,
//          to?: string (renders a link, Messaging page) | onSelect?: (conversation) => void (renders a button, docked bar),
//          size?: 56|48 (avatar size, default 56) }
import { memo } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { plural, sameId } from '../../utils/format';
import { otherParticipant, shortTime } from './chatUtils';

// Session 14: memo - a row only re-renders when its own data or online status changes
function ConversationRow({ conversation, meId, active, online, to, onSelect, size = 56 }) {
  const other = otherParticipant(conversation, meId);
  const last = conversation.lastMessage;
  const mine = last?.text && sameId(last.sender, meId);
  const unread = conversation.unreadCount || 0;
  const className = `msg-row${active ? ' is-active' : ''}${unread ? ' msg-row--unread' : ''}`;

  const content = (
    <>
      <Avatar user={other} size={size} online={online} decorative />
      <span className="msg-row__body">
        <span className="msg-row__top">
          <span className="msg-row__name">
            {other.name}
            {online && <span className="ui-sr-only"> (online)</span>}
          </span>
          {last?.createdAt && (
            <time className="msg-row__time" dateTime={last.createdAt}>{shortTime(last.createdAt)}</time>
          )}
        </span>
        <span className="msg-row__bottom">
          <span className="msg-row__preview">
            {last?.text ? `${mine ? 'You: ' : ''}${last.text}` : 'No messages yet'}
          </span>
          <Badge count={unread} max={99} label={plural(unread, 'unread message')} />
        </span>
        {conversation.gig && (
          <span className="msg-row__gig">
            <span className="ui-sr-only">Gig: </span>
            {conversation.gig.title}
          </span>
        )}
      </span>
    </>
  );

  return (
    <li>
      {to != null ? (
        <Link to={to} className={className} aria-current={active ? 'page' : undefined}>
          {content}
        </Link>
      ) : (
        <button type="button" className={className} aria-current={active ? 'true' : undefined} onClick={() => onSelect(conversation)}>
          {content}
        </button>
      )}
    </li>
  );
}

export default memo(ConversationRow);
