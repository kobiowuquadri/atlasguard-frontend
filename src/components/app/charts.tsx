'use client';

import { ChartColumn, Table2 } from 'lucide-react';
import * as React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts';
import { LanguageChip } from '@/components/app/status';
import { Table, Td, Th } from '@/components/ui/misc';
import { cn, formatMs, formatNumber, formatPercent } from '@/lib/utils';

/* Chart chrome follows the validated tokens: one series in violet #8B5CF6, hairline grid, quiet axes. */
const AXIS_TICK = { fill: '#64748b', fontSize: 11, fontFamily: 'var(--font-mono)' };
const CURSOR = { fill: 'rgb(255 255 255 / 0.04)' };

function ViewToggle({ table, onChange }: { table: boolean; onChange: (table: boolean) => void }) {
  return (
    <div className="inline-flex items-center rounded-lg bg-white/[0.03] p-0.5 inset-ring inset-ring-white/[0.07]" role="group" aria-label="View">
      {[
        { value: false, label: 'Chart', icon: ChartColumn },
        { value: true, label: 'Table', icon: Table2 },
      ].map(({ value, label, icon: Icon }) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={table === value}
          className={cn(
            'inline-flex h-6 cursor-pointer items-center gap-1 rounded-md px-2 text-[11.5px] font-medium transition-colors',
            table === value ? 'bg-white/[0.08] text-foreground' : 'text-subtle-foreground hover:text-foreground',
          )}
        >
          <Icon className="size-3.5" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  );
}

function ChartTooltipBox({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#1c1f28]/95 px-3 py-2 text-xs shadow-pop backdrop-blur">
      <div className="font-medium text-foreground">{title}</div>
      <div className="mt-1 text-muted-foreground">{children}</div>
    </div>
  );
}

/* --------------------------------------------------------- Activity */

interface ActivityPoint {
  date: string;
  runs: number;
  completed: number;
}

const dayLabel = (d: string, opts: Intl.DateTimeFormatOptions) => new Date(`${d}T00:00:00`).toLocaleDateString('en-NG', opts);

function ActivityTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ActivityPoint }> }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]!.payload;
  return (
    <ChartTooltipBox title={dayLabel(p.date, { weekday: 'short', day: 'numeric', month: 'short' })}>
      <span className="tabular">
        {p.runs} run{p.runs === 1 ? '' : 's'} started · {p.completed} completed
      </span>
    </ChartTooltipBox>
  );
}

export function ActivityChart({ data, title = 'Evaluation runs per day', className }: { data: ActivityPoint[]; title?: string; className?: string }) {
  const [table, setTable] = React.useState(false);
  const total = data.reduce((s, d) => s + d.runs, 0);
  return (
    <figure className={cn('flex flex-col gap-4', className)}>
      <figcaption className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[15px] font-semibold tracking-tight">{title}</div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Last {data.length} days · {formatNumber(total)} runs started
          </p>
        </div>
        <ViewToggle table={table} onChange={setTable} />
      </figcaption>
      {table ? (
        <div className="max-h-56 overflow-y-auto">
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
                  <Td className="font-mono text-xs text-muted-foreground">{d.date}</Td>
                  <Td className="text-right tabular">{d.runs}</Td>
                  <Td className="text-right tabular">{d.completed}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
              <CartesianGrid vertical={false} stroke="var(--color-chart-grid)" strokeWidth={1} />
              <XAxis
                dataKey="date"
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-chart-axis)' }}
                tickFormatter={(d: string) => dayLabel(d, { day: 'numeric', month: 'short' })}
                interval="preserveStartEnd"
                minTickGap={28}
                tickMargin={8}
              />
              <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} />
              <RechartsTooltip content={<ActivityTooltip />} cursor={CURSOR} />
              <Bar dataKey="runs" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} maxBarSize={20} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </figure>
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
  // Container query: three columns when the card is wide enough, otherwise the bar drops to its own line.
  return (
    <div className="@container">
      <ul className="flex flex-col gap-4" aria-label="Verified pass rate by language">
        {rows.map((row) => {
          const measured = row.evaluated && row.rate !== null;
          return (
            <li key={row.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 @lg:grid-cols-[10.5rem_minmax(0,1fr)_9.5rem]">
              <LanguageChip code={row.key} className="justify-self-start" />
              <div className="relative order-3 col-span-2 h-2 rounded-full bg-white/[0.06] @lg:order-none @lg:col-span-1">
                {measured && <div className="absolute inset-y-0 left-0 rounded-full bg-[#8b5cf6]" style={{ width: `${Math.max(row.rate! * 100, 1.5)}%` }} />}
              </div>
              <span className="text-right text-xs whitespace-nowrap">
                {measured ? (
                  <>
                    <span className="text-sm font-semibold text-foreground tabular">{formatPercent(row.rate)}</span>
                    <span className="ml-2 text-subtle-foreground tabular">n={row.determinate}</span>
                    {showLatency && row.averageLatencyMs != null && <span className="ml-2 text-subtle-foreground tabular">{formatMs(row.averageLatencyMs)}</span>}
                  </>
                ) : (
                  <span className="text-subtle-foreground">{row.evaluated ? 'No determinate results' : 'Not yet evaluated'}</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
