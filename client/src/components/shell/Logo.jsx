// Logo: the Hirely mark (teal rounded square with a white "H" in both modes, like the favicon); LogoLink wraps it in a link to the home page.
// Logo props: { size?: number = 34 }   LogoLink props: { size?, withName?: boolean (show the "Hirely" word), className? }
import { Link } from 'react-router-dom';

export function Logo({ size = 34 }) {
  return (
    <svg className="shell-logo__mark" viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="14" style={{ fill: 'var(--cover-1)' }} />
      <path d="M20 16h7v13h10V16h7v32h-7V35H27v13h-7z" style={{ fill: 'var(--on-cover)' }} />
    </svg>
  );
}

export default function LogoLink({ size = 34, withName = false, className = '' }) {
  return (
    <Link to="/" className={`shell-logo${className ? ` ${className}` : ''}`} aria-label="Hirely home">
      <Logo size={size} />
      {withName && <span className="shell-logo__name" aria-hidden="true">Hirely</span>}
    </Link>
  );
}
