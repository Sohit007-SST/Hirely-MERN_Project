// Small helpers shared by the gigs pages (no UI here).

// Turn [{ field, message }] from the validation middleware into { field: message } (first message wins)
export const toFieldErrors = (errors) =>
  (errors || []).reduce((acc, e) => (acc[e.field] ? acc : { ...acc, [e.field]: e.message }), {});

// "October 2026"
export const memberSince = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '';

// Posted in the last 24 hours (shown in green in the results list)
export const isFresh = (date) => Boolean(date) && Date.now() - new Date(date).getTime() < 86400000;

// Who may do what with a gig (same rules as the server)
export function gigPermissions(gig, user) {
  const isOwner = Boolean(user && gig?.client && String(gig.client._id ?? gig.client) === String(user._id));
  const isAdmin = user?.role === 'admin';
  return {
    isOwner,
    isAdmin,
    canEdit: isOwner && gig?.status === 'open',
    canDelete: isAdmin || (isOwner && gig?.status !== 'in-progress'),
    canComplete: isOwner && gig?.status === 'in-progress',
  };
}
