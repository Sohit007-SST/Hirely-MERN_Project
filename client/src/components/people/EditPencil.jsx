// EditPencil: the small icon-only Pencil button on your own profile's cards (opens the Edit intro modal).
// Props: { label: string (accessible name, e.g. "Edit about"), onClick: () => void, className? }
import { Pencil } from 'lucide-react';
import { Button } from '../ui';

export default function EditPencil({ label, onClick, className = '' }) {
  return <Button variant="tertiary" icon={Pencil} aria-label={label} title={label} onClick={onClick} className={className} />;
}
