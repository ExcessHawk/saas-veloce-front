import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function ConfirmDeleteDialog({ open, onOpenChange, onConfirm, title, description, isPending }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="w-11 h-11 rounded-2xl bg-p-d-100 flex items-center justify-center text-p-d-500 mb-4">
            <AlertTriangle size={20} />
          </div>
          <DialogTitle className="text-[16px] font-bold text-p-text-primary tracking-[-0.02em]">
            {title}
          </DialogTitle>
          {description && (
            <p className="text-[13.5px] text-p-text-secondary leading-[1.65] mt-2 mb-0">
              {description}
            </p>
          )}
        </DialogHeader>

        <div className="px-6 pt-5 pb-6 flex justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="px-4 py-[7px] rounded-[10px] border border-p-border bg-p-bg-base text-p-text-primary text-[13px] font-medium font-sans cursor-pointer transition-colors hover:bg-p-bg-subtle disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={cn(
              'px-4 py-[7px] rounded-[10px] border border-transparent bg-p-d-500 text-white text-[13px] font-semibold font-sans inline-flex items-center gap-[6px] transition-colors hover:bg-p-d-700',
              isPending && 'cursor-not-allowed opacity-70',
            )}
          >
            {isPending ? (
              <><Loader2 size={13} className="animate-spin" /> Eliminando…</>
            ) : (
              'Eliminar'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
