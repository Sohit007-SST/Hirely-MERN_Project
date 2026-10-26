// Props: { amount: number, size?: 'sm'|'md'|'lg' = 'md', label?: string (small caption above the amount, lg only, e.g. "Budget") }
import { formatINR } from '../utils/format';

// The signature element: every budget is a marigold swing-tag
export default function PriceTag({ amount, size = 'md', label }) {
  return (
    <span className={`price-tag price-tag--${size}`}>
      {label && size === 'lg' && <span className="price-tag__label">{label}</span>}
      <span className="price-tag__amount">{formatINR(amount)}</span>
    </span>
  );
}
