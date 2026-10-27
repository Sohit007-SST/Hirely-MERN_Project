// NotificationRow: one notification in the list - avatar 48px, the text with the sender's name in bold, time on the right
// and a "…" menu with "Mark as read". Unread rows get a soft teal background and a dot at the far left.
// Clicking the row marks it read and follows its link.
// Props: { notification, onOpen: (n) => void (marks it read), onMarkRead: (n) => void, fresh?: boolean (slide in) }
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Avatar } from '../ui';
import { timeAgo } from '../../utils/format';
import MoreMenu from './MoreMenu';

const SYSTEM_SENDER = { name: 'Hirely' };

// "Aman bid ₹12,000 on …" -> <strong>Aman</strong> bid ₹12,000 on …
// (messages use the full name or just the first name, so try both)
function Message({ text, name = '' }) {
  const first = name.split(' ')[0];
  const found = [name, first].find((part) => part && text.includes(part));
  if (!found) return text;
  const at = text.indexOf(found);
  return (
    <>
      {text.slice(0, at)}
      <strong>{found}</strong>
      {text.slice(at + found.length)}
    </>
  );
}

export default function NotificationRow({ notification: n, onOpen, onMarkRead, fresh = false }) {
  const sender = n.from || SYSTEM_SENDER;
  const body = (
    <>
      {!n.read && <span className="ui-sr-only">Unread: </span>}
      <Message text={n.message} name={n.from?.name} />
    </>
  );

  return (
    <li className={`rest-note${n.read ? '' : ' is-unread'}${fresh ? ' is-fresh' : ''}`}>
      <span className="rest-note__dot" aria-hidden="true" />
      <Avatar user={sender} size={48} decorative />
      <div className="rest-note__body">
        {n.link ? (
          <Link className="rest-note__text" to={n.link} onClick={() => onOpen(n)}>
            {body}
          </Link>
        ) : (
          <button type="button" className="rest-note__text" onClick={() => onOpen(n)}>
            {body}
          </button>
        )}
      </div>
      <time className="rest-note__time" dateTime={n.createdAt}>
        {timeAgo(n.createdAt)}
      </time>
      <div className="rest-note__menu">
        {!n.read && (
          <MoreMenu
            label="More actions for this notification"
            items={[{ label: 'Mark as read', icon: Check, onClick: () => onMarkRead(n) }]}
          />
        )}
      </div>
    </li>
  );
}
