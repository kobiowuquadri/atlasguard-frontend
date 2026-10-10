'use client';

import * as React from 'react';
import { LanguageRateBars } from '@/components/app/charts';
import { FilterSelect } from '@/components/app/filters';
import { HeatLegend, PassRateHeatmap } from '@/components/app/heatmap';
import { ErrorState, PageHeader } from '@/components/app/page';
import { bucketCounts } from '@/components/app/run-list';
import { LanguageChip } from '@/components/app/status';
import { VerdictBar } from '@/components/app/viz';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label, Switch } from '@/components/ui/form-controls';
import { Skeleton } from '@/components/ui/misc';
import { useLanguageInsights, useProjects, useRuns } from '@/lib/api/hooks';
import type { LanguageInsights } from '@/lib/api/types';
import { CATEGORIES } from '@/lib/constants';
import { cn, formatMs, formatNumber, formatPercent, shortId } from '@/lib/utils';

type LanguageRow = LanguageInsights['languages'][number];

function LanguageCard({ l }: { l: LanguageRow }) {
  const s = l.stats;
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold">{l.name}</div>
          {l.nativeName !== l.name ? (
            <div className="font-serif text-[15px] leading-tight text-muted-foreground italic">{l.nativeName}</div>
          ) : (
            <div className="font-mono text-[11px] leading-[19px] text-subtle-foreground">{l.language}</div>
          )}
        </div>
        <LanguageChip code={l.language} compact />
      </div>
      {l.evaluated && s ? (
        <>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-[32px] leading-none font-semibold tracking-[-0.03em]">{formatPercent(s.verifiedPassRate)}</span>
            <span className="text-xs text-muted-foreground">n={s.determinate}</span>
          </div>
          <VerdictBar counts={bucketCounts(s)} legend="none" size="sm" className="mt-4" />
          <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border pt-3.5 text-xs">
            <dt className="text-muted-foreground">Completed cases</dt>
            <dd className="text-right tabular">{formatNumber(s.total)}</dd>
            <dt className="text-muted-foreground">Avg latency</dt>
            <dd className="text-right font-mono">{formatMs(s.averageLatencyMs)}</dd>
            <dt className="text-muted-foreground">Needs review</dt>
            <dd className={cn('text-right tabular', s.needsReview > 0 && 'text-amber-200')}>{s.needsReview}</dd>
            <dt className="text-muted-foreground">Errors</dt>
            <dd className="text-right tabular">{s.errors}</dd>
            <dt className="text-muted-foreground">Groups with conflicts</dt>
            <dd className={cn('text-right tabular', l.consistency.groupsWithConflicts > 0 && 'text-red-300')}>
              {l.consistency.groupsWithConflicts}/{l.consistency.groupsCompared}
            </dd>
          </dl>
        </>
      ) : (
        <div className="mt-5 flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.025)_0_2px,transparent_2px_8px)] px-3 py-6 text-center">
          <p className="text-sm text-muted-foreground">Not yet evaluated</p>
          <p className="mt-1 text-[11px] text-subtle-foreground">No completed cases in this scope</p>
        </div>
      )}
    </Card>
  );
}

export default function InsightsPage() {
  const [projectId, setProjectId] = React.useState<string>();
  const [runId, setRunId] = React.useState<string>();
  const [includeSimulated, setIncludeSimulated] = React.useState(false);
  const projects = useProjects();
  const runs = useRuns({ projectId, status: 'COMPLETED', pageSize: 50 });
  const insights = useLanguageInsights({ projectId, runId, includeSimulated });

  React.useEffect(() => setRunId(undefined), [projectId]);

  const languages = insights.data?.languages ?? [];
  const categoryKeys = Object.keys(CATEGORIES).filter((k) => languages.some((l) => l.categories.some((c) => c.category === k)));

  return (
    <>
      <PageHeader
        title="Language insights"
        description="How N-ATLaS performs in each language. Only languages with completed evaluations show scores; the rest read “Not yet evaluated”."
        actions={
          <div className="flex h-9 items-center gap-2.5 rounded-lg bg-white/[0.03] px-3 inset-ring inset-ring-white/[0.08]">
            <Switch id="ins-sim" checked={includeSimulated} onCheckedChange={setIncludeSimulated} />
            <Label htmlFor="ins-sim" className="cursor-pointer text-[13px] font-normal text-muted-foreground">
              Include simulated runs
            </Label>
          </div>
        }
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <FilterSelect
          label="Project"
          value={projectId}
          onChange={setProjectId}
          options={(projects.data?.items ?? []).map((p) => ({ value: p.id, label: p.name }))}
          className="w-56"
        />
        <FilterSelect
          label="Run"
          value={runId}
          onChange={setRunId}
          options={(runs.data?.items ?? [])
            .filter((r) => includeSimulated || !r.isSimulated)
            .map((r) => ({ value: r.id, label: `${r.suite.name} #${shortId(r.id)}${r.isSimulated ? ' (simulated)' : ''}` }))}
          className="w-72"
        />
      </div>

      {insights.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-60 rounded-xl" />
          ))}
        </div>
      )}
      {insights.error && <ErrorState error={insights.error} onRetry={() => void insights.refetch()} />}
      {insights.data && (
        <div className={cn('flex flex-col gap-4 transition-opacity', insights.isPlaceholderData && 'opacity-60')}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {languages.map((l) => (
              <LanguageCard key={l.language} l={l} />
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-5">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Verified pass rate by language</CardTitle>
                <CardDescription>PASSED ÷ (PASSED + FAILED). Needs-review, errors and skipped cases are excluded and listed above.</CardDescription>
              </CardHeader>
              <CardContent>
                <LanguageRateBars
                  showLatency
                  rows={languages.map((l) => ({
                    key: l.language,
                    label: l.name,
                    rate: l.stats?.verifiedPassRate ?? null,
                    determinate: l.stats?.determinate ?? 0,
                    averageLatencyMs: l.stats?.averageLatencyMs ?? null,
                    evaluated: l.evaluated,
                  }))}
                />
              </CardContent>
            </Card>

            <Card className="xl:col-span-3">
              <CardHeader>
                <CardTitle>Category × language</CardTitle>
                <CardDescription>Each cell prints the pass rate and the number of decided cases behind it.</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryKeys.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border-strong px-4 py-8 text-center text-sm text-muted-foreground">
                    No category results in this scope yet.
                  </p>
                ) : (
                  <>
                    <PassRateHeatmap
                      languages={languages.map((l) => ({ code: l.language, name: l.name, evaluated: l.evaluated }))}
                      categories={categoryKeys.map((k) => ({ key: k, label: CATEGORIES[k]! }))}
                      cell={(c, lang) => languages.find((l) => l.language === lang)?.categories.find((x) => x.category === c)}
                    />
                    <HeatLegend className="mt-4" />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
