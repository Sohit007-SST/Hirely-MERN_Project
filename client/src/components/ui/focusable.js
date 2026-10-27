// Helper for Modal and Dropdown: lists the elements inside a container that the keyboard can reach.
const SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function focusableIn(container) {
  if (!container) return [];
  return [...container.querySelectorAll(SELECTOR)].filter(
    (el) => !el.closest('[inert]') && el.getAttribute('aria-hidden') !== 'true' && el.getClientRects().length > 0
  );
}
