// Props: { status: 'open'|'in-progress'|'completed'|'cancelled'|'pending'|'accepted'|'rejected'|'withdrawn'|'active'|'suspended' }
const STATUS = {
  open: ['Open', 'teal'],
  accepted: ['Accepted', 'teal'],
  active: ['Active', 'teal'],
  'in-progress': ['In progress', 'marigold'],
  pending: ['Pending', 'marigold'],
  rejected: ['Rejected', 'rust'],
  cancelled: ['Cancelled', 'rust'],
  suspended: ['Suspended', 'rust'],
  completed: ['Completed', 'ink'],
  withdrawn: ['Withdrawn', 'neutral'],
};

export default function StatusPill({ status }) {
  const [label, tone] = STATUS[status] || [
    status ? status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ') : 'Unknown',
    'neutral',
  ];
  return <span className={`pill pill--${tone}`}>{label}</span>;
}
