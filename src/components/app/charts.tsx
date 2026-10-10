'use client';

import { Table2, ChartColumn } from 'lucide-react';
import * as React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { VerdictIcon, VERDICT_COLORS } from '@/components/app/status';
import { Table, Td, Th } from '@/components/ui/misc';
import { VERDICT_LABELS, VERDICTS, type Verdict } from '@/lib/constants';
import { cn, formatMs, formatNumber, formatPercent } from '@/lib/utils';

/* Chart chrome follows the validated tokens: one series in brand violet, hairline grid. */
const AXIS_TICK = { fill: '#94a3b8', fontSize: 11 };

function ViewToggle({ table, onChange }: { table: boolean; onChange: (table: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!table)}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
      aria-pressed={table}
    >
      {table ? <ChartColumn className="size-3.5" /> : <Table2 className="size-3.5" />}
      {table ? 'Chart' : 'Table'}
    </button>
  );
}

/* --------------------------------------------------------- Activity */

interface ActivityPoint {
  date: string;
  runs: number;
  completed: number;
}

function ActivityTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ActivityPoint }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]!.payload;
  return (
    <div className="rounded-md border border-border-strong bg-elevated px-3 py-2 text-xs shadow-lg shadow-black/40">
      <div className="font-medium text-foreground">{new Date(`${p.date}T00:00:00`).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
      <div className="mt-1 text-muted-foreground">
        {p.runs} run{p.runs === 1 ? '' : 's'} started · {p.completed} completed
      </div>
    </div>
  );
}

export function ActivityChart({ data, title = 'Evaluation runs per day' }: { data: ActivityPoint[]; title?: string }) {
  const [table, setTable] = React.useState(false);
  const total = data.reduce((s, d) => s + d.runs, 0);
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{title}</span>
        <ViewToggle table={table} onChange={setTable} />
      </figcaption>
      <p className="-mt-1 text-xs text-muted-foreground">Last {data.length} days · {formatNumber(total)} runs</p>
      {table ? (
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th className="text-right">Runs started</Th>
              <Th className="text-right">Completed</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date}>
                <Td>{d.date}</Td>
                <Td className="text-right tabular">{d.runs}</Td>
                <Td className="text-right tabular">{d.completed}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid vertical={false} stroke="var(--color-chart-grid)" strokeWidth={1} />
              <XAxis
                dataKey="date"
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-chart-axis)' }}
                tickFormatter={(d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} />
              <RechartsTooltip content={<ActivityTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
              <Bar dataKey="runs" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </figure>
  );
}

/* -------------------------------------------------- Verdict breakdown */

/**
 * Part-to-whole of verdicts. Status colours always come with icon + label in the legend,
 * which doubles as the table view.
 */
export function VerdictBreakdown({ counts, className }: { counts: Partial<Record<Verdict, number>>; className?: string }) {
  const total = VERDICTS.reduce((s, v) => s + (counts[v] ?? 0), 0);
  if (total === 0) {
    return <p className={cn('text-sm text-muted-foreground', className)}>No evaluated cases yet.</p>;
  }
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full" role="img" aria-label="Verdict distribution">
        {VERDICTS.filter((v) => (counts[v] ?? 0) > 0).map((v) => (
          <div
            key={v}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ width: `${((counts[v] ?? 0) / total) * 100}%`, background: VERDICT_COLORS[v], minWidth: 4 }}
            title={`${VERDICT_LABELS[v]}: ${counts[v]}`}
          />
        ))}
      </div>
      <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {VERDICTS.map((v) => (
          <li key={v} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <VerdictIcon verdict={v} /> {VERDICT_LABELS[v]}
            </span>
            <span className="tabular text-foreground">
              {formatNumber(counts[v] ?? 0)}
              <span className="ml-2 text-xs text-subtle-foreground">{formatPercent((counts[v] ?? 0) / total, 0)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------- Pass rate by language */

export interface LanguageRateRow {
  key: string;
  label: string;
  rate: number | null;
  determinate: number;
  averageLatencyMs?: number | null;
  evaluated: boolean;
}

/**
 * Verified pass rate per language as a bar list (one hue for every bar). Languages with no
 * determinate results read "Not yet evaluated" instead of a misleading 0%.
 */
export function LanguageRateBars({ rows, showLatency = false }: { rows: LanguageRateRow[]; showLatency?: boolean }) {
  return (
    <ul className="flex flex-col gap-3" aria-label="Verified pass rate by language">
      {rows.map((row) => {
        const measured = row.evaluated && row.rate !== null;
        return (
          <li key={row.key} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[9rem_1fr_auto]">
            <span className="truncate text-muted-foreground">{row.label}</span>
            <div className="relative h-2.5 rounded-full bg-elevated">
              {measured && (
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${Math.max(row.rate! * 100, 1.5)}%`, background: 'var(--color-chart-1)' }}
                />
              )}
            </div>
            <span className="min-w-28 text-right text-xs">
              {measured ? (
                <>
                  <span className="text-sm font-medium text-foreground tabular">{formatPercent(row.rate)}</span>
                  <span className="ml-1.5 text-subtle-foreground tabular">n={row.determinate}</span>
                  {showLatency && row.averageLatencyMs != null && (
                    <span className="ml-1.5 text-subtle-foreground tabular">{formatMs(row.averageLatencyMs)}</span>
                  )}
                </>
              ) : (
                <span className="text-subtle-foreground">{row.evaluated ? 'No determinate results' : 'Not yet evaluated'}</span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/* ----------------------------------------- Category rates (Recharts) */

interface CategoryDatum {
  label: string;
  rate: number | null;
  determinate: number;
}

function CategoryTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: CategoryDatum & { pct: number } }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]!.payload;
  return (
    <div className="rounded-md border border-border-strong bg-elevated px-3 py-2 text-xs shadow-lg shadow-black/40">
      <div className="font-medium text-foreground">{p.label}</div>
      <div className="mt-1 text-muted-foreground">
        {formatPercent(p.rate)} verified pass rate · n={p.determinate}
      </div>
    </div>
  );
}

export function CategoryRateChart({ data }: { data: CategoryDatum[] }) {
  const rows = data.filter((d) => d.rate !== null).map((d) => ({ ...d, pct: Math.round((d.rate ?? 0) * 1000) / 10 }));
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No determinate results by category yet.</p>;
  return (
    <div style={{ height: Math.max(rows.length * 40 + 30, 120) }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
          <CartesianGrid horizontal={false} stroke="var(--color-chart-grid)" />
          <XAxis type="number" domain={[0, 100]} tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
          <YAxis type="category" dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} width={150} />
          <RechartsTooltip content={<CategoryTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
          <Bar dataKey="pct" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} maxBarSize={18} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
