// MeSheet: the mobile version of the Me menu. The avatar in the mobile top bar opens it as a bottom sheet
// (the shared Modal, restyled by .shell-sheet): mini profile header, the same links plus Network, and Sign out.
// Props: { user, open: boolean, onClose: () => void }
import { Link } from 'react-router-dom';
import { LogOut, Users } from 'lucide-react';
import { Modal } from '../ui';
import { MeHeader, meLinks } from './MeMenu';
import useSignOut from './useSignOut';

export default function MeSheet({ user, open, onClose }) {
  const signOut = useSignOut();
  // Clients have "Post" instead of "Network" in the bottom bar, so Network is reachable from here
  const links = [...meLinks(user), { label: 'Network', icon: Users, to: '/freelancers' }];

  return (
    <Modal open={open} onClose={onClose} title="Me" closeLabel="Close account menu" className="shell-sheet">
      <MeHeader user={user} onNavigate={onClose} />
      <nav aria-label="Account">
        <ul className="shell-sheet__list">
          {links.map(({ label, icon: Icon, to }) => (
            <li key={to}>
              <Link className="shell-sheet__item" to={to} onClick={onClose}>
                <Icon size={20} aria-hidden="true" focusable="false" />
                <span>{label}</span>
              </Link>
            </li>
          ))}
          <li className="shell-sheet__divider" role="separator" />
          <li>
            <button
              type="button"
              className="shell-sheet__item shell-sheet__item--danger"
              onClick={() => {
                onClose();
                signOut();
              }}
            >
              <LogOut size={20} aria-hidden="true" focusable="false" />
              <span>Sign out</span>
            </button>
          </li>
        </ul>
      </nav>
    </Modal>
  );
}
