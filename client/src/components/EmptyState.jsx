// Props: { title: string, text?: string, action?: ReactNode (usually a .btn link), compact?: boolean }
export default function EmptyState({ title, text, action, compact = false }) {
  return (
    <div className={`empty${compact ? ' empty--compact' : ''}`}>
      <svg className="empty__icon" viewBox="0 0 64 48" aria-hidden="true">
        <path d="M18 6h40a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H18L2 24z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="16" cy="24" r="3.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <path d="M30 20h20M30 28h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <h2 className="empty__title">{title}</h2>
      {text && <p className="empty__text">{text}</p>}
      {action && <div className="empty__action">{action}</div>}
    </div>
  );
}
