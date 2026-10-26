import { useEffect, useState } from 'react';

// Session 14: debounced value, so search inputs don't fire a request on every keystroke
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export { useDebounce };
