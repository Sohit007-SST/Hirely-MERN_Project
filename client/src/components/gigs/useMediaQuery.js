// useMediaQuery: true while a CSS media query matches (e.g. the desktop two-pane layout on /gigs).
import { useEffect, useState } from 'react';

const read = (query) => typeof window !== 'undefined' && window.matchMedia(query).matches;

export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => read(query));

  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    onChange();
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

// The width where the app shell switches to the desktop nav (and /gigs to two panes)
export const DESKTOP = '(min-width: 992px)';
