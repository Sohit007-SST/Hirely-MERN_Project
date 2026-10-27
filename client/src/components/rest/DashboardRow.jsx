// DashboardRow: one gig or bid in the dashboard list - an initial square, the title link, a grey meta line,
// a status pill, a BudgetBadge and a "…" menu of actions (View, Edit, Message).
// Props: { title: string, to?: string (no link = removed gig), meta: string, status: string, amount: number,
//          amountLabel?: string, menuItems: Dropdown items }
import { Link } from 'react-router-dom';
import { BudgetBadge, StatusPill } from '../ui';
import MoreMenu from './MoreMenu';

export default function DashboardRow({ title, to, meta, status, amount, amountLabel, menuItems }) {
  return (
    <li className="rest-dash-row">
      <span className="rest-dash-row__mark" aria-hidden="true">
        {(title || '?').trim().charAt(0).toUpperCase()}
      </span>
      <div className="rest-dash-row__main">
        {to ? (
          <Link className="rest-dash-row__title" to={to}>
            {title}
          </Link>
        ) : (
          <span className="rest-dash-row__title is-removed">{title}</span>
        )}
        <p className="rest-dash-row__meta">{meta}</p>
      </div>
      <div className="rest-dash-row__side">
        <StatusPill status={status} />
        {amount != null && <BudgetBadge amount={amount} size="sm" label={amountLabel} />}
        <MoreMenu label={`More actions for ${title}`} items={menuItems} />
      </div>
    </li>
  );
}
