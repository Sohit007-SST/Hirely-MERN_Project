// MyItemsCard: the dashboard's left-rail "My items" card. Each row switches the list on the right
// (e.g. "Posted gigs 4" / "Saved gigs 2"); the selected row is highlighted.
// Props: { items: Array<{ value: string, label: string, icon: LucideIcon, count?: number|null (null = still loading) }>,
//          value: string, onChange: (value) => void }
import { Card, Skeleton } from '../ui';

export default function MyItemsCard({ items, value, onChange }) {
  return (
    <Card title="My items" titleAs="h2" padded={false} className="rest-rail-card">
      <ul className="rest-rail-links">
        {items.map(({ value: v, label, icon: Icon, count }) => (
          <li key={v}>
            <button
              type="button"
              className={`rest-rail-link${v === value ? ' is-current' : ''}`}
              aria-pressed={v === value}
              onClick={() => onChange(v)}
            >
              <Icon size={18} aria-hidden="true" focusable="false" />
              <span className="rest-rail-link__label">{label}</span>
              {count == null ? (
                <Skeleton width={20} className="rest-rail-link__count" />
              ) : (
                <span className="rest-rail-link__count">{count}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
