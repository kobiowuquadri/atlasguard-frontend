import {
  Ban,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleMinus,
  CircleX,
  FlaskConical,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import type { CheckStatus, ConsistencyVerdict, ContentReviewStatus, FactStatus, RunStatus } from '@/lib/api/types';
import { LANGUAGES, languageName, VERDICT_LABELS, type Verdict } from '@/lib/constants';
import { cn } from '@/lib/utils';

type Variant = NonNullable<BadgeProps['variant']>;

const VERDICT_META: Record<Verdict, { variant: Variant; icon: typeof CircleCheck; text: string }> = {
  PASSED: { variant: 'success', icon: CircleCheck, text: 'text-success' },
  FAILED: { variant: 'danger', icon: CircleX, text: 'text-danger' },
  NEEDS_REVIEW: { variant: 'warning', icon: CircleAlert, text: 'text-warning' },
  ERROR: { variant: 'neutral', icon: TriangleAlert, text: 'text-slate-400' },
  SKIPPED: { variant: 'neutral', icon: CircleMinus, text: 'text-slate-500' },
};

/** Status is always icon + label, never colour alone. */
export function VerdictBadge({ verdict, className }: { verdict: Verdict | null | undefined; className?: string }) {
  if (!verdict) {
    return (
      <Badge variant="outline" className={className}>
        <CircleDashed aria-hidden /> Pending
      </Badge>
    );
  }
  const meta = VERDICT_META[verdict];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant} className={className}>
      <Icon aria-hidden /> {VERDICT_LABELS[verdict]}
    </Badge>
  );
}

export const VERDICT_COLORS: Record<Verdict, string> = {
  PASSED: 'var(--color-success)',
  FAILED: 'var(--color-danger)',
  NEEDS_REVIEW: 'var(--color-warning)',
  ERROR: '#94a3b8',
  SKIPPED: '#4b5567',
};

export function VerdictIcon({ verdict, className }: { verdict: Verdict; className?: string }) {
  const Icon = VERDICT_META[verdict].icon;
  return <Icon className={cn('size-4', VERDICT_META[verdict].text, className)} aria-hidden />;
}

/** A small status light; `pulse` adds a slow ping for live states. */
export function StatusDot({ tone, pulse = false, className }: { tone: 'success' | 'danger' | 'warning' | 'neutral' | 'primary'; pulse?: boolean; className?: string }) {
  const color = { success: 'bg-success', danger: 'bg-danger', warning: 'bg-warning', neutral: 'bg-slate-500', primary: 'bg-violet-400' }[tone];
  return (
    <span className={cn('relative inline-flex size-2 shrink-0', className)} aria-hidden>
      {pulse && <span className={cn('absolute inset-0 rounded-full animate-ping-slow', color)} />}
      <span className={cn('relative size-2 rounded-full', color)} />
    </span>
  );
}

const RUN_META: Record<RunStatus, { variant: Variant; label: string; icon?: typeof CircleCheck }> = {
  QUEUED: { variant: 'neutral', label: 'Queued', icon: CircleDashed },
  RUNNING: { variant: 'primary', label: 'Running' },
  COMPLETED: { variant: 'success', label: 'Completed', icon: CircleCheck },
  FAILED: { variant: 'danger', label: 'Failed', icon: CircleX },
  CANCELLED: { variant: 'neutral', label: 'Cancelled', icon: Ban },
};

export function RunStatusBadge({ status, className }: { status: RunStatus; className?: string }) {
  const meta = RUN_META[status];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant} className={className}>
      {Icon ? <Icon aria-hidden /> : <StatusDot tone="primary" pulse className="mx-0.5 size-1.5 [&>span]:size-1.5" />} {meta.label}
    </Badge>
  );
}

const CONSISTENCY_META: Record<ConsistencyVerdict, { variant: Variant; label: string; icon: typeof CircleCheck }> = {
  CONSISTENT: { variant: 'success', label: 'Consistent', icon: CircleCheck },
  INCONSISTENT: { variant: 'danger', label: 'Inconsistent', icon: CircleX },
  NEEDS_REVIEW: { variant: 'warning', label: 'Needs review', icon: CircleAlert },
  INSUFFICIENT_DATA: { variant: 'neutral', label: 'Insufficient data', icon: CircleMinus },
};

export function ConsistencyBadge({ verdict, className }: { verdict: ConsistencyVerdict; className?: string }) {
  const meta = CONSISTENCY_META[verdict];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant} className={className}>
      <Icon aria-hidden /> {meta.label}
    </Badge>
  );
}

const REVIEW_META: Record<ContentReviewStatus, { variant: Variant; label: string }> = {
  DRAFT: { variant: 'neutral', label: 'Draft' },
  PENDING_REVIEW: { variant: 'warning', label: 'Pending review' },
  VERIFIED: { variant: 'success', label: 'Verified' },
  REJECTED: { variant: 'danger', label: 'Rejected' },
};

export function ReviewStatusBadge({ status }: { status: ContentReviewStatus }) {
  const meta = REVIEW_META[status];
  return (
    <Badge variant={meta.variant}>
      {status === 'VERIFIED' ? <ShieldCheck aria-hidden /> : null}
      {meta.label}
    </Badge>
  );
}

const CHECK_META: Record<CheckStatus, { label: string; icon: typeof CircleCheck; color: string }> = {
  pass: { label: 'Pass', icon: CircleCheck, color: 'text-green-300' },
  fail: { label: 'Fail', icon: CircleX, color: 'text-red-300' },
  uncertain: { label: 'Needs review', icon: CircleAlert, color: 'text-amber-200' },
  not_applicable: { label: 'Info', icon: CircleMinus, color: 'text-slate-400' },
};

export function CheckStatusLabel({ status }: { status: CheckStatus }) {
  const meta = CHECK_META[status];
  const Icon = meta.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', meta.color)}>
      <Icon className="size-3.5" aria-hidden /> {meta.label}
    </span>
  );
}

export const FACT_META: Record<FactStatus | 'no_response', { variant: Variant; label: string; icon: typeof CircleCheck; text: string }> = {
  supported: { variant: 'success', label: 'Supported', icon: CircleCheck, text: 'text-success' },
  contradicted: { variant: 'danger', label: 'Contradicted', icon: CircleX, text: 'text-danger' },
  not_found: { variant: 'warning', label: 'Not found', icon: CircleMinus, text: 'text-warning' },
  uncertain: { variant: 'warning', label: 'Uncertain', icon: CircleAlert, text: 'text-warning' },
  no_response: { variant: 'neutral', label: 'No response', icon: CircleDashed, text: 'text-slate-400' },
};

export function FactStatusBadge({ status }: { status: FactStatus | 'no_response' }) {
  const meta = FACT_META[status];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant}>
      <Icon aria-hidden /> {meta.label}
    </Badge>
  );
}

export function SimulatedBadge({ className }: { className?: string }) {
  return (
    <Badge variant="warning" className={className} title="Development fixtures — not N-ATLaS output">
      <FlaskConical aria-hidden /> Simulated
    </Badge>
  );
}

const SHORT = Object.fromEntries(LANGUAGES.map((l) => [l.code, l.short])) as Record<string, string>;

/** Neutral language chip: a mono code plate plus the name. Languages never get status colours. */
export function LanguageChip({ code, count, compact = false, className }: { code: string; count?: number; compact?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center gap-1.5 rounded-full bg-white/[0.04] pr-2 pl-0.5 text-[11.5px] font-medium whitespace-nowrap text-slate-300 inset-ring inset-ring-white/10',
        compact && 'pr-0.5',
        className,
      )}
      title={compact ? languageName(code) : undefined}
    >
      <span className="inline-flex h-[18px] min-w-[26px] items-center justify-center rounded-full bg-white/[0.07] px-1 font-mono text-[10px] tracking-wide text-slate-200">
        {SHORT[code] ?? code.toUpperCase()}
      </span>
      {!compact && languageName(code)}
      {count !== undefined && <span className="tabular text-subtle-foreground">{count}</span>}
    </span>
  );
}
