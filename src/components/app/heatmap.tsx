'use client';

import { LanguageChip } from '@/components/app/status';
import { Tooltip } from '@/components/ui/overlays';
import type { ResultBucket } from '@/lib/api/types';
import { cn, formatPercent } from '@/lib/utils';

/*
 * Sequential single-hue ramp (validated ordinal on the card surface). Low → dark, high → light.
 * Text colour switches to ink on the light steps to keep ≥ 4.5:1.
 */
const BINS = [
  { bg: 'var(--color-heat-1)', ink: '#ffffff', label: '0–20%' },
  { bg: 'var(--color-heat-2)', ink: '#ffffff', label: '20–40%' },
  { bg: 'var(--color-heat-3)', ink: '#0b0b10', label: '40–60%' },
  { bg: 'var(--color-heat-4)', ink: '#0b0b10', label: '60–80%' },
  { bg: 'var(--color-heat-5)', ink: '#0b0b10', label: '80–100%' },
];

const binFor = (rate: number) => BINS[Math.min(BINS.length - 1, Math.floor(rate * BINS.length))]!;

const HATCH = 'repeating-linear-gradient(135deg, rgb(255 255 255 / 0.05) 0 2px, transparent 2px 7px)';

export function HeatLegend({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground', className)}>
      <span className="eyebrow">Verified pass rate</span>
      <span className="flex items-center gap-[2px]">
        {BINS.map((b) => (
          <span key={b.label} title={b.label} className="h-2.5 w-10 first:rounded-l-[3px] last:rounded-r-[3px]" style={{ background: b.bg }} />
        ))}
      </span>
      <span className="tabular">0% → 100%</span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-[3px] inset-ring inset-ring-white/15" style={{ backgroundImage: HATCH }} /> No determinate results
      </span>
    </div>
  );
}

/**
 * Categories × languages. Every cell prints its value and sample size, so the grid is also
 * the table view; colour only reinforces the number.
 */
export function PassRateHeatmap({
  languages,
  categories,
  cell,
}: {
  languages: Array<{ code: string; name: string; evaluated: boolean }>;
  categories: Array<{ key: string; label: string }>;
  cell: (category: string, language: string) => ResultBucket | null | undefined;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] table-fixed border-separate border-spacing-[3px] text-sm">
        <caption className="sr-only">Verified pass rate for each category and language</caption>
        <thead>
          <tr>
            <th scope="col" className="w-[30%] px-2 pb-2 text-left lg:w-[11.5rem]">
              <span className="eyebrow">Category</span>
            </th>
            {languages.map((l) => (
              <th key={l.code} scope="col" className="px-1 pb-2 text-left font-normal">
                <span className="flex min-w-0 items-center gap-1.5">
                  <LanguageChip code={l.code} compact />
                  <span className="truncate text-[11.5px] text-muted-foreground">{l.name}</span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c.key}>
              <th scope="row" className="px-2 py-1 text-left text-[13px] font-medium text-slate-300">
                {c.label}
              </th>
              {languages.map((l) => {
                const b = cell(c.key, l.code);
                const rate = b?.verifiedPassRate ?? null;
                if (rate === null) {
                  return (
                    <td key={l.code} className="h-14 rounded-md px-3 inset-ring inset-ring-white/[0.06]" style={{ backgroundImage: HATCH }}>
                      <span className="text-xs text-subtle-foreground">{b && b.total > 0 ? 'No determinate' : '—'}</span>
                    </td>
                  );
                }
                const bin = binFor(rate);
                return (
                  <Tooltip
                    key={l.code}
                    content={
                      <span>
                        <span className="font-medium">
                          {c.label} · {l.name}
                        </span>
                        <span className="mt-0.5 block text-muted-foreground tabular">
                          {b!.passed} passed / {b!.determinate} determinate · {b!.needsReview} need review
                        </span>
                      </span>
                    }
                  >
                    <td className="h-14 rounded-md px-3 transition-[filter] hover:brightness-110" style={{ background: bin.bg, color: bin.ink }}>
                      <span className="block text-sm leading-tight font-semibold tabular">{formatPercent(rate, 0)}</span>
                      <span className="block text-[11px] leading-tight opacity-75 tabular">n={b!.determinate}</span>
                    </td>
                  </Tooltip>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
