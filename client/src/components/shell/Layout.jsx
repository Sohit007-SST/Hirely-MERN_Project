// Layout: the page grid inside the 1128px content width. Every redesigned page wraps its content in it.
//
//   <Layout variant="three" left={<ProfileMiniCard />} right={<FollowCard />}>
//     <Feed />
//   </Layout>
//
// Props: { variant?: 'three'|'two-right'|'two-left'|'full' = 'full', left?: ReactNode, right?: ReactNode,
//          children (the main column), className? (extra class on the grid, e.g. "home-layout") }
//
// Desktop widths (gap 24px, max width 1128px):
//   three     -> left rail 225px | main 555px (1fr) | right rail 300px   (Home feed)
//   two-right -> main 1fr | right rail 300px                              (Profile, Gig details)
//   two-left  -> left rail 225px | main 1fr                               (Notifications, Dashboard)
//   full      -> one column                                               (Messaging, Admin)
// Responsive:
//   < 1200px  the right rail of "three" hides first (left rail + main stay side by side)
//   < 992px   every variant becomes one column, in source order: left rail, main, right rail
//             (the right rail of "three" stays hidden; two-right shows its rail under the main column)
// A rail the variant doesn't use is ignored, and a missing rail drops its column
// (e.g. "three" without `right` renders like "two-left"), so pass a skeleton while a rail is loading.
// Class hooks for page CSS: .shell-layout, .shell-layout--<variant>, .shell-layout__left, __main, __right.

const RAILS = {
  three: { left: true, right: true },
  'two-right': { left: false, right: true },
  'two-left': { left: true, right: false },
  full: { left: false, right: false },
};

// Which grid to draw for the rails that are actually there
function resolveVariant(hasLeft, hasRight, requested) {
  if (hasLeft && hasRight) return requested;
  if (hasLeft) return 'two-left';
  if (hasRight) return 'two-right';
  return 'full';
}

export default function Layout({ variant = 'full', left, right, children, className = '' }) {
  const rails = RAILS[variant] || RAILS.full;
  const hasLeft = rails.left && left != null && left !== false;
  const hasRight = rails.right && right != null && right !== false;
  const shown = resolveVariant(hasLeft, hasRight, RAILS[variant] ? variant : 'full');

  return (
    <div className={`shell-layout shell-layout--${shown}${className ? ` ${className}` : ''}`}>
      {hasLeft && <div className="shell-layout__left">{left}</div>}
      <div className="shell-layout__main">{children}</div>
      {hasRight && <div className="shell-layout__right">{right}</div>}
    </div>
  );
}
