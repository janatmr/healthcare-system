import { useEffect, useState } from 'react';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  delay = 300,
}) {
  const [local, setLocal] = useState(value || '');

  useEffect(() => {
    setLocal(value || '');
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== value) onChange?.(local);
    }, delay);
    return () => clearTimeout(timer);
  }, [local, delay, onChange, value]);

  return (
    <input
      className="search-input"
      type="search"
      value={local}
      placeholder={placeholder}
      onChange={(event) => setLocal(event.target.value)}
      aria-label={placeholder}
    />
  );
}
