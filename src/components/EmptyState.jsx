import { cn } from '@/lib/utils';

/**
 * Unified empty/zero-data state. Use across list pages instead of ad-hoc
 * centered divs so the look is consistent.
 *
 *   <EmptyState icon={Inbox} title="Sin cursos" description="…" action={<Button/>} />
 */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-14 text-center', className)}>
      {Icon && (
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-6" />
        </div>
      )}
      <div className="space-y-1">
        <p className="text-[15px] font-semibold text-foreground">{title}</p>
        {description && <p className="mx-auto max-w-sm text-[13px] text-muted-foreground">{description}</p>}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
