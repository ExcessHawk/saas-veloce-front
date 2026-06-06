import { useState, useRef, useEffect } from 'react';
import { Building2, Search, Check } from 'lucide-react';
import { useSchoolSearch } from '@/hooks/useSchoolSearch';

/**
 * Combobox to search a school by name / slug and capture the resulting UUID
 * into a hidden field. The user never types the UUID.
 *
 * Props:
 *   - value:    current school UUID (string | '')
 *   - onChange: fn(uuid) — called when a row is picked or selection cleared
 *   - error:    optional string shown below the field
 *   - label:    optional label override
 */
export function SchoolCombobox({ value, onChange, error, label = 'Escuela' }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(null);
  const rootRef = useRef(null);

  const { data, isFetching } = useSchoolSearch(query);
  const results = data?.results ?? [];

  // Close popup when clicking outside
  useEffect(() => {
    function onClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handlePick = (row) => {
    setPicked(row);
    setQuery(row.name);
    setOpen(false);
    onChange(row.id);
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    setOpen(true);
    // User edited the text — clear previous pick so they must re-confirm
    if (picked && v !== picked.name) {
      setPicked(null);
      onChange('');
    }
  };

  return (
    <div className="mb-[6px]" ref={rootRef}>
      <label className="block text-[13px] font-medium text-p-text-primary mb-[6px]">
        {label}
      </label>

      <div className="relative">
        <div className="flex items-center gap-[10px] px-[14px] py-[10px] rounded-[12px] border border-p-border bg-p-bg-base focus-within:border-p-text-primary transition-colors">
          <Building2 size={15} className="text-p-text-tertiary" />
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setOpen(true)}
            placeholder="Busca tu escuela por nombre…"
            autoComplete="off"
            spellCheck={false}
            maxLength={60}
            className="flex-1 border-0 bg-transparent text-[13.5px] text-p-text-primary placeholder:text-p-text-tertiary outline-none"
          />
          {isFetching && <Search size={13} className="text-p-text-tertiary animate-pulse" />}
          {picked && !isFetching && <Check size={14} className="text-p-s-500" />}
        </div>

        {open && query.trim().length >= 2 && (
          <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-[12px] border border-p-border bg-p-bg-base shadow-p-md">
            {isFetching && (
              <div className="px-[14px] py-3 text-[12.5px] text-p-text-tertiary">Buscando…</div>
            )}
            {!isFetching && results.length === 0 && (
              <div className="px-[14px] py-3 text-[12.5px] text-p-text-tertiary">
                No se encontró ninguna escuela. Verifica el nombre o pide invitación al director.
              </div>
            )}
            {!isFetching && results.map((row) => (
              <button
                type="button"
                key={row.id}
                onClick={() => handlePick(row)}
                className="w-full text-left px-[14px] py-2 text-[13px] text-p-text-primary hover:bg-p-bg-subtle border-0 bg-transparent cursor-pointer flex flex-col"
              >
                <span className="font-medium">{row.name}</span>
                <span className="text-[11px] text-p-text-tertiary">{row.slug}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hidden field carries the UUID into the form */}
      <input type="hidden" value={value ?? ''} readOnly />

      {error && (
        <p className="mt-[6px] text-[12px] text-p-d-500">{error}</p>
      )}
      <p className="mt-[6px] text-[11.5px] text-p-text-tertiary">
        ¿No aparece tu escuela? Pide al director que active el directorio público o que te envíe una invitación.
      </p>
    </div>
  );
}
