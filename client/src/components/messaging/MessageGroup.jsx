// MessageGroup: consecutive messages from one person - avatar, name and time on the first line, then just the text.
// Both sides are left-aligned; my own groups show my name like everyone else's.
// Props: { sender: { _id, name, avatar }, mine: boolean, messages: Array<{ _id, text, createdAt }> }
import { Link } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import { formatTime } from '../../utils/format';

export default function MessageGroup({ sender, mine, messages }) {
  const first = messages[0];
  const name = sender?.name || 'Deleted account';
  return (
    <li className={`msg-group${mine ? ' msg-group--mine' : ''}`}>
      <Avatar user={sender} size={40} decorative className="msg-group__avatar" />
      <div className="msg-group__body">
        <p className="msg-group__head">
          {sender?._id ? (
            <Link className="msg-group__name" to={`/users/${sender._id}`}>{name}</Link>
          ) : (
            <span className="msg-group__name">{name}</span>
          )}
          {mine && <span className="ui-sr-only"> (you)</span>}
          <time className="msg-group__time" dateTime={first.createdAt}>{formatTime(first.createdAt)}</time>
        </p>
        {messages.map((m) => (
          <p key={m._id} className="msg-line" title={formatTime(m.createdAt)}>
            {m.text}
          </p>
        ))}
      </div>
    </li>
  );
}
