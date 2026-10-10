'use client';

import { FlaskConical } from 'lucide-react';
import Link from 'next/link';
import { StatusDot } from '@/components/app/status';
import { Skeleton } from '@/components/ui/misc';
import { Tooltip } from '@/components/ui/overlays';
import { useModelStatus } from '@/lib/api/hooks';
import { cn } from '@/lib/utils';

const STATUS = {
  available: { label: 'N-ATLaS connected', short: 'Connected', tone: 'success' },
  unavailable: { label: 'N-ATLaS unavailable', short: 'Unavailable', tone: 'danger' },
  not_configured: { label: 'N-ATLaS not configured', short: 'Not configured', tone: 'neutral' },
} as const;

export function ModelStatusPill({ className }: { className?: string }) {
  const { data, isLoading } = useModelStatus();
  if (isLoading || !data) return <Skeleton className={cn('h-7 w-40 rounded-full', className)} />;
  const meta = STATUS[data.natlas.health.status];
  return (
    <Tooltip content={data.natlas.health.message}>
      <Link
        href="/settings#model"
        className={cn(
          'inline-flex h-7 items-center gap-2 rounded-full bg-white/[0.03] px-3 text-xs text-muted-foreground inset-ring inset-ring-white/10 transition-colors hover:text-foreground',
          className,
        )}
      >
        <StatusDot tone={meta.tone} pulse={meta.tone === 'success'} />
        {meta.label}
      </Link>
    </Tooltip>
  );
}

/** Sidebar instrument: live provider health, model id, and whether fixtures are on. */
export function ModelStatusCard({ onNavigate }: { onNavigate?: () => void }) {
  const { data, isLoading } = useModelStatus();
  if (isLoading || !data) return <Skeleton className="h-[74px] w-full rounded-lg" />;
  const meta = STATUS[data.natlas.health.status];
  return (
    <Tooltip content={data.natlas.health.message} side="right">
      <Link
        href="/settings#model"
        onClick={onNavigate}
        className="block rounded-lg bg-white/[0.025] px-3 py-2.5 inset-ring inset-ring-white/[0.07] transition-colors hover:bg-white/[0.045]"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="eyebrow">Model</span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <StatusDot tone={meta.tone} pulse={meta.tone === 'success'} />
            {meta.short}
          </span>
        </div>
        <div className="mt-1.5 truncate font-mono text-[11.5px] text-slate-300">{data.natlas.model.modelIdentifier}</div>
        {data.fixtures.enabled && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-200/90">
            <FlaskConical className="size-3" aria-hidden /> Simulated fixtures enabled
          </div>
        )}
      </Link>
    </Tooltip>
  );
}

export function SimulatedModeBanner() {
  const { data } = useModelStatus();
  if (!data?.fixtures.enabled) return null;
  return (
    <div role="status" className="relative flex items-center gap-2.5 border-b border-amber-400/15 bg-[linear-gradient(90deg,rgb(245_158_11/0.12),rgb(245_158_11/0.04))] px-4 py-2 text-xs text-amber-100/90 sm:px-6">
      <FlaskConical className="size-3.5 shrink-0 text-amber-300" aria-hidden />
      <span>
        <strong className="font-semibold text-amber-200">Development mode:</strong> simulated fixtures are enabled on this server. Fixture runs are
        labelled <em>Simulated</em> and are never N-ATLaS output.
      </span>
    </div>
  );
}
