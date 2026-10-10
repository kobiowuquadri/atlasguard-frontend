import { CircleAlert, RotateCw } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/misc';
import { errorMessage } from '@/lib/api/client';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  meta,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** Small mono label above the title. */
  eyebrow?: React.ReactNode;
  /** A row of facts under the description (ids, timestamps, owners). */
  meta?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-5 animate-enter md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-2.5 flex flex-wrap items-center gap-2">{eyebrow}</div>}
        <h1 className="text-[26px] leading-8 font-semibold tracking-[-0.022em] text-balance text-foreground sm:text-[28px] sm:leading-9">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-pretty text-muted-foreground">{description}</p>}
        {meta && <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** "label value" pair for PageHeader meta rows. */
export function MetaItem({ icon: Icon, children }: { icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {Icon && <Icon className="size-3.5 text-subtle-foreground" />}
      {children}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-border-strong px-6 py-14 text-center',
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dot-grid opacity-60 mask-radial" />
      <div className="relative mb-4 flex size-11 items-center justify-center rounded-xl bg-[linear-gradient(180deg,rgb(139_92_246/0.22),rgb(139_92_246/0.06))] inset-ring inset-ring-violet-400/25">
        <Icon className="size-5 text-violet-200" />
      </div>
      <h3 className="relative text-[15px] font-semibold tracking-tight">{title}</h3>
      {description && <p className="relative mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="relative mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center rounded-xl border border-red-400/20 bg-danger-soft/60 px-6 py-10 text-center', className)}>
      <CircleAlert className="mb-2.5 size-6 text-red-300" />
      <p className="text-sm font-medium">Couldn’t load this data</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{errorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          <RotateCw /> Retry
        </Button>
      )}
    </div>
  );
}

export function LoadingRows({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2', className)} aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}
