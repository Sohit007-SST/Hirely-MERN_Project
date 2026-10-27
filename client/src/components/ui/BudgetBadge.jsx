// BudgetBadge: how every budget and bid amount is shown - an amber rounded box with the rupee icon and a bold amount (₹12,000).
// Props: { amount: number, size?: 'sm'|'md'|'lg' = 'md', label?: string (small caption before the amount, e.g. "Budget"), className? }
import { IndianRupee } from 'lucide-react';

const number = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const ICON = { sm: 14, md: 16, lg: 20 };

export default function BudgetBadge({ amount, size = 'md', label, className = '' }) {
  const n = Number(amount);
  const value = number.format(Number.isFinite(n) ? n : 0);
  return (
    <span className={`ui-budget ui-budget--${size}${className ? ` ${className}` : ''}`}>
      {label && <span className="ui-budget__label">{label}</span>}
      <IndianRupee className="ui-budget__icon" size={ICON[size] || 16} strokeWidth={2.5} aria-hidden="true" focusable="false" />
      <span className="ui-budget__amount">
        <span className="ui-sr-only">₹</span>
        {value}
      </span>
    </span>
  );
}
