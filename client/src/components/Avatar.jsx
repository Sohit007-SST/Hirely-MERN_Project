// Props: { user: { _id?, name, avatar?: { url } }, size?: 'xs'|'sm'|'md'|'lg'|'xl' = 'md', online?: boolean, decorative?: boolean }
import { initials } from '../utils/format';

// Calm, readable backgrounds for initials (white text on all of them)
const COLORS = ['#1b2340', '#0f7b6c', '#b4441c', '#5b4bb0', '#2b62c4', '#7a5a00', '#9a3a6c', '#36713a'];

function colorFor(seed = '') {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Avatar({ user, size = 'md', online = false, decorative = false }) {
  const name = user?.name || 'User';
  const url = user?.avatar?.url;
  const a11y = decorative
    ? { 'aria-hidden': true }
    : { role: 'img', 'aria-label': online ? `${name} (online)` : name };

  return (
    <span
      className={`avatar avatar--${size}`}
      style={url ? undefined : { '--avatar-bg': colorFor(String(user?._id || name)) }}
      {...a11y}
    >
      {url ? (
        <img className="avatar__img" src={url} alt="" loading="lazy" decoding="async" />
      ) : (
        <span className="avatar__initials">{initials(name)}</span>
      )}
      {online && <span className="avatar__dot" />}
    </span>
  );
}
