// Old PriceTag API kept for pages not yet redesigned: the swing-tag is gone, it now renders ui/BudgetBadge.
// Props: { amount: number, size?: 'sm'|'md'|'lg' = 'md', label?: string (caption, lg only, e.g. "Budget") }
import BudgetBadge from './ui/BudgetBadge';

export default function PriceTag({ amount, size = 'md', label }) {
  return <BudgetBadge amount={amount} size={size} label={size === 'lg' ? label : undefined} />;
}
