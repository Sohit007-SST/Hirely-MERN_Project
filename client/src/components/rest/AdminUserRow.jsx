// AdminUserRow: one account in the admin users list - avatar, name, email, role pill, join date, status pill
// and a Suspend / Restore pill (admins can't be suspended, so their row has no button).
// Props: { user, busy: boolean, onToggle: (user) => void }
import { Link } from 'react-router-dom';
import { Avatar, Button, StatusPill } from '../ui';
import { formatDate } from '../../utils/format';

const ROLE_LABEL = { client: 'Client', freelancer: 'Freelancer', admin: 'Admin' };

export default function AdminUserRow({ user, busy, onToggle }) {
  const isAdmin = user.role === 'admin';
  return (
    <li className="rest-admin-row">
      <Link className="rest-admin-row__who" to={`/users/${user._id}`}>
        <Avatar user={user} size={40} decorative />
        <span className="rest-admin-row__names">
          <span className="rest-admin-row__name">{user.name}</span>
          <span className="rest-admin-row__email">{user.email}</span>
        </span>
      </Link>
      <span className="rest-admin-row__cell">
        <span className="ui-sr-only">Role: </span>
        <span className={`rest-role-pill rest-role-pill--${user.role}`}>{ROLE_LABEL[user.role] || user.role}</span>
      </span>
      <span className="rest-admin-row__cell rest-admin-row__date">
        <span className="ui-sr-only">Joined </span>
        {formatDate(user.createdAt)}
      </span>
      <span className="rest-admin-row__cell">
        <span className="ui-sr-only">Status: </span>
        <StatusPill status={user.isBanned ? 'suspended' : 'active'} />
      </span>
      <span className="rest-admin-row__action">
        {!isAdmin && (
          <Button
            variant={user.isBanned ? 'secondary' : 'danger'}
            size="sm"
            onClick={() => onToggle(user)}
            loading={busy}
            loadingText="Saving…"
            aria-label={`${user.isBanned ? 'Restore' : 'Suspend'} ${user.name}`}
          >
            {user.isBanned ? 'Restore' : 'Suspend'}
          </Button>
        )}
      </span>
    </li>
  );
}
