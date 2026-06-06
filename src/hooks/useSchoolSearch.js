import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

/**
 * Client-side regex mirroring the backend whitelist. Letters, digits,
 * accented chars, space, hyphen, dot, apostrophe — 2 to 60 chars. Any other
 * character is stripped before sending so the API never has to reject
 * something obviously malformed.
 */
const ALLOWED = /[^\p{L}\p{N}\s\-.']/gu;

function sanitize(input) {
  if (typeof input !== 'string') return '';
  return input.replace(ALLOWED, '').slice(0, 60).trim();
}

/** Debounce a value by `ms` milliseconds. */
function useDebounced(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/**
 * Live search for the public schools directory. Debounces input by 300 ms,
 * sanitizes locally, and only fires when the cleaned term is ≥2 chars.
 *
 * Returns `{ data: { results: [...] }, isFetching, error }`.
 */
export function useSchoolSearch(rawQuery) {
  const debounced = useDebounced(rawQuery, 300);
  const term = sanitize(debounced);
  const enabled = term.length >= 2;

  return useQuery({
    queryKey: ['schools', 'search', term],
    queryFn: () =>
      api.get('/api/public/schools/search', { params: { q: term } }).then((r) => r.data),
    enabled,
    staleTime: 30_000,
    retry: false,
  });
}
