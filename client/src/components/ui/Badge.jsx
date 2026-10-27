// Badge: small rust circle with an unread count ("9+" above 9); renders nothing when the count is 0.
// Props: { count: number, max?: number = 9, label?: string (screen-reader text, default "<count> unread"), className? }
export default function Badge({ count, max = 9, label, className = '' }) {
  const n = Number(count) || 0;
  if (n <= 0) return null;
  return (
    <span className={`ui-badge${className ? ` ${className}` : ''}`}>
      <span aria-hidden="true">{n > max ? `${max}+` : n}</span>
      <span className="ui-sr-only">{label || `${n} unread`}</span>
    </span>
  );
}
