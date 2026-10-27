// SearchBox: the rounded search field in the top bar. Enter goes to /gigs?q=<text> (an empty search opens /gigs).
// Props: { className? }
import { useEffect, useId, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function SearchBox({ className = '' }) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const inputId = useId();
  const [value, setValue] = useState('');

  // On the gigs page the box shows the search that is in the URL
  useEffect(() => {
    if (pathname === '/gigs') setValue(new URLSearchParams(search).get('q') || '');
  }, [pathname, search]);

  const submit = (e) => {
    e.preventDefault();
    const q = value.trim();
    navigate(q ? `/gigs?q=${encodeURIComponent(q)}` : '/gigs');
  };

  return (
    <form role="search" className={`shell-search${className ? ` ${className}` : ''}`} onSubmit={submit}>
      <label htmlFor={inputId} className="ui-sr-only">Search gigs and people</label>
      <Search className="shell-search__icon" size={16} aria-hidden="true" focusable="false" />
      <input
        id={inputId}
        className="shell-search__input"
        type="search"
        placeholder="Search gigs and people"
        autoComplete="off"
        enterKeyHint="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </form>
  );
}
