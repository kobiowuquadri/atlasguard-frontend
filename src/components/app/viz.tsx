'use client';

import * as React from 'react';
import { VerdictIcon, VERDICT_COLORS } from '@/components/app/status';
import { Tooltip } from '@/components/ui/overlays';
import { VERDICT_LABELS, VERDICTS, type Verdict } from '@/lib/constants';
import { cn, formatNumber, formatPercent } from '@/lib/utils';

/* ----------------------------------------------------------- VerdictBar */

interface Segment {
  key: Verdict | 'PENDING';
  label: string;
  value: number;
  color: string;
}

/**
 * Part-to-whole of verdicts as one stacked bar (2px surface gaps between segments).
 * Status colours are never alone: the legend carries icon + label + count and doubles
 * as the table view.
 */
export function VerdictBar({
  counts,
  pending = 0,
  legend = 'full',
  legendColumns = 3,
  size = 'md',
  className,
}: {
  counts: Partial<Record<Verdict, number>>;
  pending?: number;
  legend?: 'full' | 'inline' | 'none';
  legendColumns?: 2 | 3;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const segments: Segment[] = VERDICTS.map((v) => ({ key: v, label: VERDICT_LABELS[v], value: counts[v] ?? 0, color: VERDICT_COLORS[v] }));
  if (pending > 0) segments.push({ key: 'PENDING', label: 'Pending', value: pending, color: '' });
  const total = segments.reduce((s, x) => s + x.value, 0);
  const visible = segments.filter((s) => s.value > 0);
  const height = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-3.5' }[size];

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {total === 0 ? (
        <div className={cn('w-full rounded-full bg-white/[0.06]', height)} role="img" aria-label="No results yet" />
      ) : (
        <div
          className={cn('flex w-full gap-[2px]', height)}
          role="img"
          aria-label={`Verdicts: ${visible.map((s) => `${s.label} ${s.value}`).join(', ')}`}
        >
          {visible.map((s, i) => (
            <Tooltip
              key={s.key}
              content={
                <span className="flex items-center gap-2">
                  <span className="font-medium">{s.label}</span>
                  <span className="tabular text-muted-foreground">
                    {formatNumber(s.value)} · {formatPercent(s.value / total, 0)}
                  </span>
                </span>
              }
            >
              <div
                className={cn(
                  'h-full min-w-[3px] transition-opacity hover:opacity-80',
                  i === 0 && 'rounded-l-full',
                  i === visible.length - 1 && 'rounded-r-full',
                  s.key === 'PENDING' && 'bg-white/[0.09] progress-stripes',
                )}
                style={s.key === 'PENDING' ? { flexGrow: s.value, flexBasis: 0 } : { flexGrow: s.value, flexBasis: 0, backgroundColor: s.color }}
              />
            </Tooltip>
          ))}
        </div>
      )}

      {legend === 'full' && total > 0 && (
        <ul className={cn('grid grid-cols-2 gap-x-6 gap-y-2', legendColumns === 3 && 'sm:grid-cols-3')}>
          {segments
            .filter((s) => s.key !== 'PENDING' || s.value > 0)
            .map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  {s.key === 'PENDING' ? <span className="size-3.5 rounded-full border border-dashed border-white/25" aria-hidden /> : <VerdictIcon verdict={s.key} className="size-3.5" />}
                  <span className="truncate">{s.label}</span>
                </span>
                <span className="text-foreground tabular">
                  {formatNumber(s.value)}
                  <span className="ml-1.5 text-[11px] text-subtle-foreground">{formatPercent(s.value / total, 0)}</span>
                </span>
              </li>
            ))}
        </ul>
      )}

      {legend === 'inline' && total > 0 && (
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {visible
            .filter((s) => s.key !== 'PENDING')
            .map((s) => (
              <li key={s.key} className="flex items-center gap-1" title={s.label}>
                <VerdictIcon verdict={s.key as Verdict} className="size-3.5" />
                <span className="sr-only">{s.label}</span>
                <span className="tabular">{s.value}</span>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ Sparkline */

/** A single-series trend glyph (no axes). Pair it with the number it summarises. */
export function Sparkline({ values, width = 112, height = 32, label, className }: { values: number[]; width?: number; height?: number; label: string; className?: string }) {
  const gid = `sp${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => [i * step, height - 3 - (v / max) * (height - 7)] as const);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('');
  const last = pts[pts.length - 1]!;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={label} className={cn('shrink-0 overflow-visible', className)}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8b5cf6" stopOpacity="0.32" />
          <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line}L${width} ${height}L0 ${height}Z`} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke="#8b5cf6" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={2.75} fill="#c4b5fd" stroke="#181b22" strokeWidth={1.5} />
    </svg>
  );
}

/* ---------------------------------------------------------------- Meter */

/** Thin single-value meter (0–1), e.g. benchmark review coverage. */
export function Meter({ value, label, className }: { value: number; label: string; className?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]', className)} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={label}>
      <div className="h-full rounded-full bg-[#8b5cf6]" style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }} />
    </div>
  );
}
