import { useState, useCallback } from 'react';

export function useSorting(initialField = null, initialDir = 'asc') {
  const [field, setField] = useState(initialField);
  const [dir, setDir] = useState(initialDir);

  const toggle = useCallback((newField) => {
    setField((prev) => {
      if (prev === newField) {
        setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return newField;
      }
      setDir('asc');
      return newField;
    });
  }, []);

  const sort = useCallback(
    (items) => {
      if (!field || !items?.length) return items ?? [];
      return [...items].sort((a, b) => {
        const av = a[field] ?? '';
        const bv = b[field] ?? '';
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return dir === 'asc' ? cmp : -cmp;
      });
    },
    [field, dir],
  );

  return { field, dir, toggle, sort };
}
