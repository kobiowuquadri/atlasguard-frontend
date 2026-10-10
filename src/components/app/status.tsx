import {
  Ban,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleMinus,
  CircleX,
  FlaskConical,
  LoaderCircle,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import type { CheckStatus, ConsistencyVerdict, ContentReviewStatus, FactStatus, RunStatus } from '@/lib/api/types';
import { languageName, VERDICT_LABELS, type Verdict } from '@/lib/constants';
import { cn } from '@/lib/utils';

type Variant = NonNullable<BadgeProps['variant']>;

const VERDICT_META: Record<Verdict, { variant: Variant; icon: typeof CircleCheck }> = {
  PASSED: { variant: 'success', icon: CircleCheck },
  FAILED: { variant: 'danger', icon: CircleX },
  NEEDS_REVIEW: { variant: 'warning', icon: CircleAlert },
  ERROR: { variant: 'neutral', icon: TriangleAlert },
  SKIPPED: { variant: 'neutral', icon: CircleMinus },
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
  ERROR: '#64748b',
  SKIPPED: '#475569',
};

export function VerdictIcon({ verdict, className }: { verdict: Verdict; className?: string }) {
  const Icon = VERDICT_META[verdict].icon;
  const color = { PASSED: 'text-success', FAILED: 'text-danger', NEEDS_REVIEW: 'text-warning', ERROR: 'text-slate-400', SKIPPED: 'text-slate-500' }[verdict];
  return <Icon className={cn('size-4', color, className)} aria-hidden />;
}

const RUN_META: Record<RunStatus, { variant: Variant; label: string; icon: typeof CircleCheck; spin?: boolean }> = {
  QUEUED: { variant: 'neutral', label: 'Queued', icon: CircleDashed },
  RUNNING: { variant: 'primary', label: 'Running', icon: LoaderCircle, spin: true },
  COMPLETED: { variant: 'success', label: 'Completed', icon: CircleCheck },
  FAILED: { variant: 'danger', label: 'Failed', icon: CircleX },
  CANCELLED: { variant: 'neutral', label: 'Cancelled', icon: Ban },
};

export function RunStatusBadge({ status, className }: { status: RunStatus; className?: string }) {
  const meta = RUN_META[status];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant} className={className}>
      <Icon aria-hidden className={meta.spin ? 'animate-spin' : undefined} /> {meta.label}
    </Badge>
  );
}

const CONSISTENCY_META: Record<ConsistencyVerdict, { variant: Variant; label: string; icon: typeof CircleCheck }> = {
  CONSISTENT: { variant: 'success', label: 'Consistent', icon: CircleCheck },
  INCONSISTENT: { variant: 'danger', label: 'Inconsistent', icon: CircleX },
  NEEDS_REVIEW: { variant: 'warning', label: 'Needs review', icon: CircleAlert },
  INSUFFICIENT_DATA: { variant: 'neutral', label: 'Insufficient data', icon: CircleMinus },
};

export function ConsistencyBadge({ verdict }: { verdict: ConsistencyVerdict }) {
  const meta = CONSISTENCY_META[verdict];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant}>
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
  pass: { label: 'Pass', icon: CircleCheck, color: 'text-success' },
  fail: { label: 'Fail', icon: CircleX, color: 'text-danger' },
  uncertain: { label: 'Needs review', icon: CircleAlert, color: 'text-warning' },
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

const FACT_META: Record<FactStatus | 'no_response', { variant: Variant; label: string }> = {
  supported: { variant: 'success', label: 'Supported' },
  contradicted: { variant: 'danger', label: 'Contradicted' },
  not_found: { variant: 'warning', label: 'Not found' },
  uncertain: { variant: 'warning', label: 'Uncertain' },
  no_response: { variant: 'neutral', label: 'No response' },
};

export function FactStatusBadge({ status }: { status: FactStatus | 'no_response' }) {
  const meta = FACT_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function SimulatedBadge({ className }: { className?: string }) {
  return (
    <Badge variant="warning" className={className} title="Development fixtures — not N-ATLaS output">
      <FlaskConical aria-hidden /> Simulated
    </Badge>
  );
}

export function LanguageBadge({ code, count }: { code: string; count?: number }) {
  return (
    <Badge variant="outline" className="text-slate-300">
      {languageName(code)}
      {count !== undefined && <span className="text-subtle-foreground tabular">{count}</span>}
    </Badge>
  );
}
