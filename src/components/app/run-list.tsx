'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { LanguageChip, RunStatusBadge, SimulatedBadge } from '@/components/app/status';
import { VerdictBar } from '@/components/app/viz';
import { Progress } from '@/components/ui/misc';
import { isActive } from '@/lib/api/hooks';
import type { ResultBucket, Run, RunPreview } from '@/lib/api/types';
import { LANGUAGES } from '@/lib/constants';
import { cn, formatPercent, formatRelative, shortId } from '@/lib/utils';

type RunRow = (Run | RunPreview) & { project?: { id: string; name: string } };

const ORDER = LANGUAGES.map((l) => l.code as string);
const sortLanguages = (codes: string[]) => [...codes].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));

export function bucketCounts(b: ResultBucket | undefined | null) {
  return b ? { PASSED: b.passed, FAILED: b.failed, NEEDS_REVIEW: b.needsReview, ERROR: b.errors, SKIPPED: b.skipped } : {};
}

function RunHealth({ run }: { run: RunRow }) {
  if (isActive(run.status)) {
    const pct = run.totalCases ? (run.completedCases / run.totalCases) * 100 : 0;
    return <Progress value={pct} active label={`Run progress ${run.completedCases} of ${run.totalCases}`} />;
  }
  const overall = run.summary?.overall;
  return <VerdictBar counts={bucketCounts(overall)} pending={overall?.pending ?? 0} legend="none" size="sm" />;
}

/**
 * Evaluation runs as rich rows: what ran, where, its verdict mix and pass rate — scannable
 * without opening each run.
 */
export function RunList({ runs, showProject = true, compact = false, className }: { runs: RunRow[]; showProject?: boolean; compact?: boolean; className?: string }) {
  return (
    <ul className={cn('flex flex-col divide-y divide-border', className)}>
      {runs.map((run) => {
        const rate = run.summary?.overall?.verifiedPassRate;
        return (
          <li key={run.id}>
            <Link
              href={`/evaluations/${run.id}`}
              className={cn(
                'group grid items-center gap-x-5 gap-y-2 rounded-lg px-3 py-3 transition-colors hover:bg-white/[0.03]',
                compact ? 'grid-cols-[minmax(0,1fr)_auto]' : 'grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_9rem_7rem_4.5rem_1rem]',
              )}
            >
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-[13.5px] font-medium text-foreground">{run.suite.name}</span>
                  {run.isSimulated && <SimulatedBadge className="shrink-0" />}
                </div>
                <div className="mt-1 flex min-w-0 items-center gap-x-2 text-xs text-subtle-foreground">
                  <span className="font-mono">#{shortId(run.id)}</span>
                  {showProject && run.project && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="truncate">{run.project.name}</span>
                    </>
                  )}
                  <span aria-hidden>·</span>
                  <span className="shrink-0">{formatRelative(run.createdAt)}</span>
                </div>
                {!compact && (
                  <div className="mt-2 flex flex-wrap gap-1 md:hidden">
                    {sortLanguages(run.languages).map((code) => (
                      <LanguageChip key={code} code={code} compact />
                    ))}
                  </div>
                )}
              </div>

              {!compact && (
                <>
                  <div className="hidden flex-wrap gap-1 md:flex">
                    {sortLanguages(run.languages).map((code) => (
                      <LanguageChip key={code} code={code} compact />
                    ))}
                  </div>
                  <div className="hidden md:block">
                    <RunHealth run={run} />
                    <div className="mt-1.5 text-[11px] text-subtle-foreground tabular">
                      {run.completedCases}/{run.totalCases} cases
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-col items-end gap-1">
                {rate != null ? (
                  <span className="text-sm font-semibold text-foreground tabular">{formatPercent(rate)}</span>
                ) : (
                  <span className="text-sm text-subtle-foreground">—</span>
                )}
                <RunStatusBadge status={run.status} />
              </div>
              {!compact && <ChevronRight className="hidden size-4 text-subtle-foreground transition-transform group-hover:translate-x-0.5 md:block" aria-hidden />}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
