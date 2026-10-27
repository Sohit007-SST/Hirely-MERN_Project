// Active-link rules shared by the top nav and the bottom tab bar.
// "Gigs" covers /gigs and /gigs/:id (and its edit page), but not /gigs/new, which belongs to "Post".
export const matchGigs = (pathname) =>
  pathname === '/gigs' || (pathname.startsWith('/gigs/') && pathname !== '/gigs/new');
