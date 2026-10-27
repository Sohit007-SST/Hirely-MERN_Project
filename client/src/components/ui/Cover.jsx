// Cover: the profile banner, an original two-colour gradient picked from the user id (no images needed).
// Props: { id: string (user id), height?: 56|200 = 56, className?, children? (e.g. a camera button) }
import { hashId } from './hashId';

const TONES = 6; // --cover-1 … --cover-6

export function coverColors(id = '') {
  const h = hashId(id);
  const a = h % TONES;
  const b = (a + 1 + (Math.floor(h / TONES) % (TONES - 1))) % TONES; // always different from a
  return [a + 1, b + 1];
}

export default function Cover({ id, height = 56, className = '', children }) {
  const [a, b] = coverColors(id);
  return (
    <div
      className={`ui-cover ui-cover--${height === 200 ? 200 : 56}${className ? ` ${className}` : ''}`}
      style={{ backgroundImage: `linear-gradient(135deg, var(--cover-${a}), var(--cover-${b}))` }}
      aria-hidden={children ? undefined : true}
    >
      {children}
    </div>
  );
}
