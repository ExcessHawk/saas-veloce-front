import { useState, useMemo, useRef } from 'react';
import { Search, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Popover } from 'radix-ui';
import { ICON_PICKER_ICONS } from '@/lib/icon-picker-icons';
import { cn } from '@/lib/utils';

export function LucideIcon({ name, size = 16, className, ...props }) {
  if (!name) return null;
  const Icon = LucideIcons[name];
  if (!Icon) return (
    <span className={cn('inline-block rounded bg-p-bg-muted', className)} style={{ width: size, height: size }} />
  );
  return <Icon size={size} className={className} {...props} />;
}

const COLS = 8;

export function IconPicker({ value, onChange, placeholder = 'Seleccionar ícono' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);

  const handleOpenChange = (next) => {
    setOpen(next);
    if (!next) setQuery('');
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return ICON_PICKER_ICONS;
    const q = query.toLowerCase();
    return ICON_PICKER_ICONS.filter((n) => n.toLowerCase().includes(q));
  }, [query]);

  const SelectedIcon = value ? LucideIcons[value] : null;

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'w-full flex items-center gap-2 px-[10px] py-[9px] rounded-[10px] border text-[13.5px] font-[inherit] text-left cursor-pointer bg-p-bg-base text-p-text-primary transition-[border-color] duration-[120ms]',
            open ? 'border-p-border-strong' : 'border-p-border hover:border-p-border-strong',
          )}
        >
          {SelectedIcon ? (
            <>
              <SelectedIcon size={15} className="text-p-text-secondary shrink-0" />
              <span className="flex-1">{value}</span>
            </>
          ) : (
            <span className="flex-1 text-p-text-tertiary">{placeholder}</span>
          )}
          {value ? (
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="text-p-text-tertiary hover:text-p-text-primary cursor-pointer flex"
            >
              <X size={13} />
            </span>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-p-text-tertiary shrink-0">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            setTimeout(() => searchRef.current?.focus(), 0);
          }}
          style={{ width: 'max(var(--radix-popover-trigger-width), 320px)', zIndex: 50 }}
          className="bg-p-bg-base border border-p-border rounded-[14px] shadow-[0_8px_32px_oklch(0%_0_0/0.16),0_2px_8px_oklch(0%_0_0/0.08)] overflow-hidden [animation:dropIn_0.12s_ease]"
        >
          {/* Search */}
          <div className="px-3 pt-3 pb-2 border-b border-p-border">
            <div className="relative">
              <Search size={13} className="absolute left-[9px] top-1/2 -translate-y-1/2 text-p-text-tertiary pointer-events-none" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar ícono…"
                className="w-full pl-[28px] pr-7 py-[6px] text-[13px] font-[inherit] bg-p-bg-subtle border border-p-border rounded-[8px] text-p-text-primary outline-none placeholder:text-p-text-tertiary"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 border-none bg-transparent text-p-text-tertiary cursor-pointer p-0 flex"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="text-[11px] text-p-text-tertiary mt-[5px]">
              {filtered.length} ícono{filtered.length !== 1 ? 's' : ''}{query && ` · "${query}"`}
            </div>
          </div>

          {/* Grid */}
          <div className="overflow-y-auto max-h-[240px] p-2">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-[13px] text-p-text-tertiary">Sin resultados para "{query}"</div>
            ) : (
              <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
                {filtered.map((name) => {
                  const Icon = LucideIcons[name];
                  if (!Icon) return null;
                  const isSelected = value === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      title={name}
                      onClick={() => { onChange(isSelected ? '' : name); handleOpenChange(false); }}
                      className={cn(
                        'flex items-center justify-center w-full aspect-square rounded-[8px] border transition-all duration-[80ms] cursor-pointer',
                        isSelected
                          ? 'bg-p-accent text-p-accent-text border-transparent'
                          : 'bg-transparent border-transparent text-p-text-secondary hover:bg-p-bg-subtle hover:text-p-text-primary hover:border-p-border',
                      )}
                    >
                      <Icon size={16} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-p-border bg-p-bg-subtle">
            <p className="text-[11px] text-p-text-tertiary">Clic para seleccionar · Clic de nuevo para deseleccionar</p>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
