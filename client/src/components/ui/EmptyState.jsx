// EmptyState: shown when a list has nothing in it - an icon in a soft circle, a title, one line of help and an optional action.
// Props: { title: string, text?: string, action?: ReactNode (usually a <Button>), icon?: LucideIcon = Inbox,
//          compact?: boolean (less padding, for use inside cards), titleAs?: 'h2'|'h3' = 'h2', className? }
import { Inbox } from 'lucide-react';

export default function EmptyState({ title, text, action, icon: Icon = Inbox, compact = false, titleAs: Title = 'h2', className = '' }) {
  return (
    <div className={`ui-empty${compact ? ' ui-empty--compact' : ''}${className ? ` ${className}` : ''}`}>
      <span className="ui-empty__icon" aria-hidden="true">
        <Icon size={compact ? 24 : 28} focusable="false" />
      </span>
      <Title className="ui-empty__title">{title}</Title>
      {text && <p className="ui-empty__text">{text}</p>}
      {action && <div className="ui-empty__action">{action}</div>}
    </div>
  );
}
