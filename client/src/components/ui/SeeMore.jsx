// SeeMore: clamps long text to 3 lines and adds a "…see more" button that expands it in place (only if the text really overflows).
// Props: { children: string | ReactNode, lines?: number = 3, as?: 'p'|'div' = 'p', className? }
import { useLayoutEffect, useRef, useState } from 'react';

export default function SeeMore({ children, lines = 3, as: Tag = 'p', className = '' }) {
  const textRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  // Measure while clamped; re-measure when the width changes (e.g. rotating a phone)
  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || expanded) return undefined;
    const measure = () => setOverflows(el.scrollHeight - el.clientHeight > 1);
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children, lines, expanded]);

  // The button disappears on expand, so keep keyboard users in place by focusing the text
  const expand = () => {
    setExpanded(true);
    requestAnimationFrame(() => textRef.current?.focus());
  };

  return (
    <div className={`ui-seemore${className ? ` ${className}` : ''}`}>
      <Tag
        ref={textRef}
        className={`ui-seemore__text${expanded ? '' : ' is-clamped'}`}
        style={expanded ? undefined : { WebkitLineClamp: lines }}
        tabIndex={expanded ? -1 : undefined}
      >
        {children}
      </Tag>
      {overflows && !expanded && (
        <button type="button" className="ui-seemore__btn" aria-expanded="false" onClick={expand}>
          …see more
        </button>
      )}
    </div>
  );
}
