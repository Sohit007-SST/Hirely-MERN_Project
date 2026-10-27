// Tabs: a row of pill tabs (role="tablist"); the selected one is filled teal. Left/Right/Home/End move between tabs.
// Props: { tabs: Array<{ value: string, label: ReactNode, count?: number, icon?: LucideIcon }>, value: string,
//          onChange: (value) => void, label: string (aria-label of the tab list), idPrefix?: string
//          (tab ids become `${idPrefix}-tab-${value}` and point at panels with id `${idPrefix}-panel-${value}`), className? }
import { useRef } from 'react';

export default function Tabs({ tabs, value, onChange, label, idPrefix, className = '' }) {
  const listRef = useRef(null);

  const onKeyDown = (e) => {
    const i = tabs.findIndex((t) => t.value === value);
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(tabs[next].value);
    listRef.current?.querySelectorAll('[role="tab"]')[next]?.focus();
  };

  return (
    <div ref={listRef} className={`ui-pills${className ? ` ${className}` : ''}`} role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      {tabs.map(({ value: v, label: text, count, icon: Icon }) => {
        const selected = v === value;
        return (
          <button
            key={v}
            type="button"
            role="tab"
            id={idPrefix ? `${idPrefix}-tab-${v}` : undefined}
            aria-controls={idPrefix ? `${idPrefix}-panel-${v}` : undefined}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={`ui-pill${selected ? ' is-selected' : ''}`}
            onClick={() => onChange(v)}
          >
            {Icon && <Icon size={16} aria-hidden="true" focusable="false" />}
            {text}
            {count != null && <span className="ui-pill__count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
