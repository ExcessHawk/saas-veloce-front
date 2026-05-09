import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';

export function SortableHead({ field, label, sorting, className }) {
  const isActive = sorting.field === field;

  return (
    <TableHead
      className={`cursor-pointer select-none hover:text-foreground ${className ?? ''}`}
      onClick={() => sorting.toggle(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive ? (
          sorting.dir === 'asc'
            ? <ChevronUp className="size-3.5" />
            : <ChevronDown className="size-3.5" />
        ) : (
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        )}
      </div>
    </TableHead>
  );
}
