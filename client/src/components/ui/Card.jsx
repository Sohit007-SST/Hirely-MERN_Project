// Card: white surface box with an optional header (title + action on the right) and an optional "Show all →" footer link.
// Props: { title?: ReactNode, titleAs?: 'h2'|'h3' = 'h2', action?: ReactNode, footerTo?: string, footerLabel?: string = 'Show all',
//          as?: 'section'|'article'|'div' = 'section', padded?: boolean = true, className?, children, ...rest }
import { useId } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Card({
  title,
  titleAs: Title = 'h2',
  action,
  footerTo,
  footerLabel = 'Show all',
  as: Tag = 'section',
  padded = true,
  className = '',
  children,
  ...rest
}) {
  const titleId = useId();
  const hasHead = title || action;

  return (
    <Tag
      className={`ui-card${padded ? '' : ' ui-card--flush'}${className ? ` ${className}` : ''}`}
      aria-labelledby={title && Tag === 'section' ? titleId : undefined}
      {...rest}
    >
      {hasHead && (
        <div className="ui-card__head">
          {title && <Title id={titleId} className="ui-card__title">{title}</Title>}
          {action && <div className="ui-card__action">{action}</div>}
        </div>
      )}
      {children != null && <div className="ui-card__body">{children}</div>}
      {footerTo && (
        <Link className="ui-card__foot" to={footerTo}>
          {footerLabel}
          <ArrowRight size={16} aria-hidden="true" focusable="false" />
        </Link>
      )}
    </Tag>
  );
}
