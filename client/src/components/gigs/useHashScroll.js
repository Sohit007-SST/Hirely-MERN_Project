// useHashScroll: once the page is ready, scroll to the section named in the URL hash (#qa, #bid, #bids).
// The Home feed links to these. #bid and #bids fall back to each other, because which one exists depends on the viewer.
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const FALLBACK = { bid: 'bids', bids: 'bid' };

// smooth=false for the jump on page load (a smooth scroll there gets cut short while the page is still settling)
export function scrollToSection(id, focusSelector, smooth = true) {
  const el = document.getElementById(id) || document.getElementById(FALLBACK[id]);
  if (!el) return false;
  const animate = smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: animate ? 'smooth' : 'auto', block: 'start' });
  if (focusSelector) el.querySelector(focusSelector)?.focus({ preventScroll: true });
  return true;
}

// ready: true once the sections the hash may point to are on screen
export default function useHashScroll(ready) {
  const { hash, key } = useLocation();
  const done = useRef('');

  useEffect(() => {
    const id = hash.replace('#', '');
    if (!ready || !id || done.current === `${key}${hash}`) return;
    // Wait a frame so layout (and the window scroll reset on navigation) has settled
    // and jump again shortly after, in case cards above it were still growing
    const frame = requestAnimationFrame(() => {
      if (scrollToSection(id, null, false)) done.current = `${key}${hash}`;
    });
    const again = setTimeout(() => scrollToSection(id, null, false), 300);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(again);
    };
  }, [ready, hash, key]);
}
