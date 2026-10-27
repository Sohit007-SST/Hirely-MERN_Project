// MoreMenu: the round "…" icon button that opens a small Dropdown menu of row actions (View, Edit, Message, Mark as read).
// Props: { label: string (accessible name, e.g. "More actions for Logo design"), items: Dropdown items, className? }
import { MoreHorizontal } from 'lucide-react';
import { Button, Dropdown } from '../ui';

export default function MoreMenu({ label, items, className = '' }) {
  if (!items?.length) return null;
  return (
    <Dropdown
      className={`rest-more${className ? ` ${className}` : ''}`}
      align="end"
      label={label}
      items={items}
      trigger={<Button variant="tertiary" size="sm" icon={MoreHorizontal} aria-label={label} />}
    />
  );
}
