// StartPostBox: the "start a post" card at the top of the feed - my avatar, a big rounded fake input and role-aware shortcuts.
// Props: { user } (clients: post a gig; freelancers: find matching gigs; admins: the admin panel)
import { Link } from 'react-router-dom';
import { Briefcase, ClipboardList, Plus, Search, Shield, Users } from 'lucide-react';
import { Avatar, Button } from '../ui';

// What the fake input says and where it goes, plus the shortcut buttons under it
function promptFor(user) {
  if (user.role === 'client') {
    return {
      text: 'Post a gig…',
      to: '/gigs/new',
      shortcuts: [
        { to: '/gigs/new', label: 'Post a gig', icon: Plus },
        { to: '/gigs', label: 'Browse gigs', icon: Briefcase },
        { to: '/freelancers', label: 'Find freelancers', icon: Users },
      ],
    };
  }
  if (user.role === 'admin') {
    return {
      text: 'Search open gigs…',
      to: '/gigs',
      shortcuts: [
        { to: '/admin', label: 'Admin panel', icon: Shield },
        { to: '/gigs', label: 'Browse gigs', icon: Briefcase },
        { to: '/freelancers', label: 'Find freelancers', icon: Users },
      ],
    };
  }
  const skill = user.skills?.[0];
  return {
    text: 'Find gigs that match your skills…',
    to: skill ? `/gigs?q=${encodeURIComponent(skill)}` : '/gigs',
    shortcuts: [
      { to: '/gigs', label: 'Browse gigs', icon: Briefcase },
      { to: '/dashboard', label: 'See your bids', icon: ClipboardList },
      { to: '/freelancers', label: 'Find freelancers', icon: Users },
    ],
  };
}

export default function StartPostBox({ user }) {
  const { text, to, shortcuts } = promptFor(user);
  return (
    <section className="ui-card home-start" aria-label="Get started">
      <div className="home-start__row">
        <Avatar user={user} size={48} decorative />
        <Link to={to} className="home-start__input">
          {user.role === 'client' ? <Plus size={18} aria-hidden="true" focusable="false" /> : <Search size={18} aria-hidden="true" focusable="false" />}
          <span>{text}</span>
        </Link>
      </div>
      <div className="home-start__shortcuts">
        {shortcuts.map((s) => (
          <Button key={s.label} variant="tertiary" size="sm" icon={s.icon} to={s.to}>
            {s.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
