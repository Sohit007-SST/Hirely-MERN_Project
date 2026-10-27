// FilterPills: a group of on/off pill buttons for filtering a list (aria-pressed); one or many can be selected.
// Props: { options: Array<{ value: string, label: ReactNode, count?: number }>, value: string | string[],
//          onChange: (value | values) => void, label: string (aria-label of the group), multiple?: boolean = false, className? }
export default function FilterPills({ options, value, onChange, label, multiple = false, className = '' }) {
  const selected = multiple ? value || [] : [value];

  const toggle = (v) => {
    if (!multiple) return onChange(v);
    return onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  };

  return (
    <div className={`ui-pills${className ? ` ${className}` : ''}`} role="group" aria-label={label}>
      {options.map(({ value: v, label: text, count }) => {
        const on = selected.includes(v);
        return (
          <button
            key={v}
            type="button"
            aria-pressed={on}
            className={`ui-pill${on ? ' is-selected' : ''}`}
            onClick={() => toggle(v)}
          >
            {text}
            {count != null && <span className="ui-pill__count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
