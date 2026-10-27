// RailLinksCard: a small left-rail card with a title and a list of icon links (e.g. "Manage your notifications").
// Props: { title: string, links: Array<{ to: string, label: string, icon: LucideIcon, hint?: string }>, className? }
import { Link } from 'react-router-dom';
import { Card } from '../ui';

export default function RailLinksCard({ title, links, className = '' }) {
  return (
    <Card title={title} titleAs="h2" padded={false} className={`rest-rail-card${className ? ` ${className}` : ''}`}>
      <ul className="rest-rail-links">
        {links.map(({ to, label, icon: Icon, hint }) => (
          <li key={to}>
            <Link className="rest-rail-link" to={to}>
              <Icon size={18} aria-hidden="true" focusable="false" />
              <span className="rest-rail-link__text">
                <span className="rest-rail-link__label">{label}</span>
                {hint && <span className="rest-rail-link__hint">{hint}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
