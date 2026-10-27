// Avatar: round profile photo, or initials on a theme colour picked from the user id; optional online dot and white ring.
// Props: { user: { _id?, name, avatar?: { url } }, size?: 24|32|40|48|56|72|104|152 = 40, online?: boolean,
//          ring?: boolean (white ring for overlapping a Cover), decorative?: boolean (hide from screen readers), className? }
import { initials } from '../../utils/format';
import { hashId } from './hashId';

const SIZES = [24, 32, 40, 48, 56, 72, 104, 152];
// Initials sit on --cover-1 … --cover-5 (white text passes WCAG AA on all five)
const TONES = 5;

export default function Avatar({ user, size = 40, online = false, ring = false, decorative = false, className = '' }) {
  const px = SIZES.includes(Number(size)) ? Number(size) : 40;
  const name = user?.name || 'User';
  const url = user?.avatar?.url;
  const tone = (hashId(user?._id || name) % TONES) + 1;
  const a11y = decorative
    ? { 'aria-hidden': true }
    : { role: 'img', 'aria-label': online ? `${name} (online)` : name };
  const classes = ['ui-avatar', `ui-avatar--${px}`, ring && 'ui-avatar--ring', className].filter(Boolean).join(' ');

  return (
    <span className={classes} style={url ? undefined : { '--avatar-bg': `var(--cover-${tone})` }} {...a11y}>
      {url ? (
        <img className="ui-avatar__img" src={url} alt="" loading="lazy" decoding="async" width={px} height={px} />
      ) : (
        <span className="ui-avatar__initials">{initials(name)}</span>
      )}
      {online && <span className="ui-avatar__dot" />}
    </span>
  );
}
