import { cn } from '@/lib/utils';

export function StatCard({ label, value, sub, icon: Icon, warn = false, isLoading = false }) {
  return (
    <div className={cn(
      'bg-p-bg-base rounded-2xl shadow-p-sm p-5',
      warn ? 'border border-p-w-500' : 'border border-p-border'
    )}>
      <div className="flex justify-between items-start mb-[14px]">
        <div className={cn(
          'w-[38px] h-[38px] rounded-[10px] flex items-center justify-center',
          warn ? 'bg-p-w-100 text-p-w-700' : 'bg-p-bg-subtle text-p-text-secondary'
        )}>
          {Icon && <Icon size={17} />}
        </div>
      </div>

      {isLoading ? (
        <div className="h-9 w-16 bg-p-bg-subtle rounded-lg animate-pulse" />
      ) : (
        <div className={cn(
          'text-[30px] font-bold tracking-[-0.04em] leading-none',
          warn ? 'text-p-w-700' : 'text-p-text-primary'
        )}>
          {value}
        </div>
      )}

      <div className="text-[13px] text-p-text-secondary mt-[6px] font-medium">{label}</div>
      {sub && <div className="text-[11.5px] text-p-s-700 mt-1">{sub}</div>}
    </div>
  );
}
