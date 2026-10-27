// Skeleton: grey shimmering placeholders shown while content loads, plus ready-made shapes for posts, list rows, profiles and whole pages.
// Skeleton props: { width?: string|number, height?: string|number, shape?: 'text'|'rect'|'circle'|'pill' = 'text', className? }
// Shape props (SkeletonPost, SkeletonRow, SkeletonProfile, SkeletonPage): { count?: number = 1 (not Profile/Page), label?: string = 'Loading' }

const px = (v) => (typeof v === 'number' ? `${v}px` : v);

export default function Skeleton({ width, height, shape = 'text', className = '' }) {
  return (
    <span
      className={`ui-skeleton ui-skeleton--${shape}${className ? ` ${className}` : ''}`}
      style={{ width: px(width), height: px(height) }}
      aria-hidden="true"
    />
  );
}

// Wraps every shape so screen readers hear "Loading…" once instead of nothing
function Status({ label, className, children }) {
  return (
    <div className={className} role="status" aria-busy="true">
      <span className="ui-sr-only">{label}…</span>
      {children}
    </div>
  );
}

// A feed post: avatar + name lines, title, three text lines, budget, action bar
export function SkeletonPost({ count = 1, label = 'Loading' }) {
  return (
    <Status label={label} className="ui-skel-list">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="ui-skel-post">
          <div className="ui-skel-row__main">
            <Skeleton shape="circle" width={48} height={48} />
            <div className="ui-skel-lines">
              <Skeleton width="40%" />
              <Skeleton width="60%" height={12} />
            </div>
          </div>
          <Skeleton width="75%" height={18} />
          <Skeleton width="100%" />
          <Skeleton width="92%" />
          <Skeleton width="55%" />
          <Skeleton shape="rect" width={96} height={28} />
          <div className="ui-skel-post__bar">
            <Skeleton width="16%" />
            <Skeleton width="16%" />
            <Skeleton width="16%" />
            <Skeleton width="16%" />
          </div>
        </div>
      ))}
    </Status>
  );
}

// A list row: avatar, two text lines, a pill on the right
export function SkeletonRow({ count = 1, label = 'Loading' }) {
  return (
    <Status label={label} className="ui-skel-list ui-skel-list--rows">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="ui-skel-row">
          <div className="ui-skel-row__main">
            <Skeleton shape="circle" width={48} height={48} />
            <div className="ui-skel-lines">
              <Skeleton width={i % 2 ? '55%' : '70%'} />
              <Skeleton width={i % 2 ? '35%' : '45%'} height={12} />
            </div>
          </div>
          <Skeleton shape="pill" width={72} height={24} />
        </div>
      ))}
    </Status>
  );
}

// The profile top card: cover, big avatar overlapping it, name, headline, buttons
export function SkeletonProfile({ label = 'Loading profile' }) {
  return (
    <Status label={label} className="ui-skel-profile">
      <Skeleton shape="rect" className="ui-skel-profile__cover" />
      <div className="ui-skel-profile__body">
        <Skeleton shape="circle" className="ui-skel-profile__avatar" />
        <Skeleton width="40%" height={24} />
        <Skeleton width="60%" />
        <Skeleton width="30%" height={12} />
        <div className="ui-skel-profile__actions">
          <Skeleton shape="pill" width={96} height={32} />
          <Skeleton shape="pill" width={96} height={32} />
        </div>
      </div>
    </Status>
  );
}

// A whole page while its code or data loads: a title bar, then a main column of posts and a side card of rows
export function SkeletonPage({ label = 'Loading' }) {
  return (
    <Status label={label} className="ui-skel-page">
      <div className="ui-skel-page__head">
        <Skeleton width={220} height={24} />
        <Skeleton width={320} />
      </div>
      <div className="ui-skel-page__grid">
        <div className="ui-skel-page__main">
          {[0, 1].map((i) => (
            <div key={i} className="ui-skel-page__card">
              <div className="ui-skel-row__main">
                <Skeleton shape="circle" width={48} height={48} />
                <div className="ui-skel-lines">
                  <Skeleton width="40%" />
                  <Skeleton width="60%" height={12} />
                </div>
              </div>
              <Skeleton width="80%" height={18} />
              <Skeleton width="100%" />
              <Skeleton width="65%" />
            </div>
          ))}
        </div>
        <div className="ui-skel-page__side ui-skel-page__card">
          {[0, 1, 2].map((i) => (
            <div key={i} className="ui-skel-row__main">
              <Skeleton shape="circle" width={40} height={40} />
              <div className="ui-skel-lines">
                <Skeleton width="70%" />
                <Skeleton width="50%" height={12} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Status>
  );
}
