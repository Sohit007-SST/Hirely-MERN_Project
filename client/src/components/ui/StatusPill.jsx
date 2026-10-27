// StatusPill: small coloured pill with a dot that names a gig, bid or account status ("Open", "In progress", "Rejected"…).
// Props: { status: 'open'|'in-progress'|'completed'|'cancelled'|'pending'|'accepted'|'rejected'|'withdrawn'|'active'|'suspended'|string, className? }
const STATUS = {
  open: ['Open', 'success'],
  accepted: ['Accepted', 'success'],
  active: ['Active', 'success'],
  'in-progress': ['In progress', 'primary'],
  pending: ['Pending', 'primary'],
  rejected: ['Rejected', 'danger'],
  cancelled: ['Cancelled', 'danger'],
  suspended: ['Suspended', 'danger'],
  completed: ['Completed', 'neutral'],
  withdrawn: ['Withdrawn', 'muted'],
};

export default function StatusPill({ status, className = '' }) {
  const [label, tone] = STATUS[status] || [
    status ? status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ') : 'Unknown',
    'muted',
  ];
  return <span className={`ui-status ui-status--${tone}${className ? ` ${className}` : ''}`}>{label}</span>;
}
