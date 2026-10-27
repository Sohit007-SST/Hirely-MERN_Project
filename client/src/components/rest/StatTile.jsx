// StatTile: one small number tile - an icon in a soft circle, the value, a label and an optional grey hint.
// Props: { icon: LucideIcon, label: string, value: ReactNode (a number, or e.g. a <BudgetBadge>), hint?: string,
//          tone?: 'primary'|'money'|'success'|'danger' = 'primary' (colour of the icon circle) }
export default function StatTile({ icon: Icon, label, value, hint, tone = 'primary' }) {
  return (
    <div className="rest-stat">
      <span className={`rest-stat__icon rest-stat__icon--${tone}`} aria-hidden="true">
        <Icon size={20} focusable="false" />
      </span>
      <div className="rest-stat__text">
        <span className="rest-stat__value">{value}</span>
        <span className="rest-stat__label">{label}</span>
        {hint && <span className="rest-stat__hint">{hint}</span>}
      </div>
    </div>
  );
}

// A row of grey tile placeholders while the numbers load
export function StatTilesSkeleton({ count = 3, className = '' }) {
  return (
    <div className={`rest-stats${className ? ` ${className}` : ''}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rest-stat">
          <span className="ui-skeleton ui-skeleton--circle rest-stat__icon" />
          <div className="rest-stat__text">
            <span className="ui-skeleton ui-skeleton--text rest-stat__skel-value" />
            <span className="ui-skeleton ui-skeleton--text rest-stat__skel-label" />
          </div>
        </div>
      ))}
    </div>
  );
}
