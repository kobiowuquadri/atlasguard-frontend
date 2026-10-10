'use client';

import { FlaskConical } from 'lucide-react';
import Link from 'next/link';
import { Tooltip } from '@/components/ui/overlays';
import { useModelStatus } from '@/lib/api/hooks';
import { cn } from '@/lib/utils';

const STATUS = {
  available: { label: 'N-ATLaS connected', dot: 'bg-success', ring: 'ring-success/30' },
  unavailable: { label: 'N-ATLaS unavailable', dot: 'bg-danger', ring: 'ring-danger/30' },
  not_configured: { label: 'N-ATLaS not configured', dot: 'bg-slate-500', ring: 'ring-slate-500/30' },
} as const;

export function ModelStatusPill({ className }: { className?: string }) {
  const { data, isLoading } = useModelStatus();
  if (isLoading || !data) {
    return <span className={cn('h-7 w-40 animate-pulse-soft rounded-full bg-elevated', className)} aria-hidden />;
  }
  const meta = STATUS[data.natlas.health.status];
  return (
    <Tooltip content={data.natlas.health.message}>
      <Link
        href="/settings#model"
        className={cn(
          'inline-flex h-7 items-center gap-2 rounded-full border border-border bg-background-subtle px-3 text-xs text-muted-foreground transition-colors hover:text-foreground',
          className,
        )}
      >
        <span className={cn('size-2 rounded-full ring-4', meta.dot, meta.ring)} aria-hidden />
        {meta.label}
      </Link>
    </Tooltip>
  );
}

export function SimulatedModeBanner() {
  const { data } = useModelStatus();
  if (!data?.fixtures.enabled) return null;
  return (
    <div role="status" className="flex items-center gap-2 border-b border-warning/25 bg-warning-soft px-4 py-1.5 text-xs text-amber-200 sm:px-6">
      <FlaskConical className="size-3.5 shrink-0" aria-hidden />
      <span>
        <strong className="font-semibold">Development mode:</strong> simulated fixtures are enabled on this server. Fixture runs are
        labelled <em>Simulated</em> and are never N-ATLaS output.
      </span>
    </div>
  );
}
