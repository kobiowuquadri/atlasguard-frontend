'use client';

import { Languages } from 'lucide-react';
import * as React from 'react';
import { CategoryRateChart, LanguageRateBars } from '@/components/app/charts';
import { FilterSelect } from '@/components/app/filters';
import { ErrorState, LoadingRows, PageHeader } from '@/components/app/page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label, Switch } from '@/components/ui/form-controls';
import { Table, Td, Th } from '@/components/ui/misc';
import { useLanguageInsights, useProjects, useRuns } from '@/lib/api/hooks';
import { cn, formatMs, formatNumber, formatPercent, shortId } from '@/lib/utils';

export default function InsightsPage() {
  const [projectId, setProjectId] = React.useState<string>();
  const [runId, setRunId] = React.useState<string>();
  const [includeSimulated, setIncludeSimulated] = React.useState(false);
  const projects = useProjects();
  const runs = useRuns({ projectId, status: 'COMPLETED', pageSize: 50 });
  const insights = useLanguageInsights({ projectId, runId, includeSimulated });

  React.useEffect(() => setRunId(undefined), [projectId]);

  const languages = insights.data?.languages ?? [];

  return (
    <>
      <PageHeader
        title="Language insights"
        description="How N-ATLaS performs in each language. Only languages with completed evaluations show scores; the rest read “Not yet evaluated”."
        actions={
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5">
            <Switch id="ins-sim" checked={includeSimulated} onCheckedChange={setIncludeSimulated} />
            <Label htmlFor="ins-sim" className="text-xs text-muted-foreground">
              Include simulated runs
            </Label>
          </div>
        }
      />
      <div className="mb-5 flex flex-wrap gap-2">
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

      {insights.isLoading && <LoadingRows rows={5} />}
      {insights.error && <ErrorState error={insights.error} onRetry={() => void insights.refetch()} />}
      {insights.data && (
        <div className={cn('flex flex-col gap-4', insights.isPlaceholderData && 'opacity-60')}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {languages.map((l) => (
              <Card key={l.language} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold">{l.name}</div>
                    <div className="text-xs text-subtle-foreground">{l.nativeName}</div>
                  </div>
                  <Languages className="size-4 text-violet-300" aria-hidden />
                </div>
                {l.evaluated && l.stats ? (
                  <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
                    <dt className="text-muted-foreground">Verified pass rate</dt>
                    <dd className="text-right font-semibold tabular">{formatPercent(l.stats.verifiedPassRate)}</dd>
                    <dt className="text-muted-foreground">Completed cases</dt>
                    <dd className="text-right tabular">{formatNumber(l.stats.total)}</dd>
                    <dt className="text-muted-foreground">Avg latency</dt>
                    <dd className="text-right tabular">{formatMs(l.stats.averageLatencyMs)}</dd>
                    <dt className="text-muted-foreground">Needs review</dt>
                    <dd className="text-right tabular">{l.stats.needsReview}</dd>
                    <dt className="text-muted-foreground">Errors</dt>
                    <dd className="text-right tabular">{l.stats.errors}</dd>
                    <dt className="text-muted-foreground">Groups with conflicts</dt>
                    <dd className="text-right tabular">
                      {l.consistency.groupsWithConflicts}/{l.consistency.groupsCompared}
                    </dd>
                  </dl>
                ) : (
                  <p className="mt-4 rounded-md border border-dashed border-border-strong px-3 py-4 text-center text-sm text-muted-foreground">
                    Not yet evaluated
                  </p>
                )}
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Verified pass rate by language</CardTitle>
              <p className="text-xs text-muted-foreground">PASSED ÷ (PASSED + FAILED). Needs-review, errors and skipped cases are excluded and listed above.</p>
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

          <div className="grid gap-4 lg:grid-cols-2">
            {languages
              .filter((l) => l.evaluated)
              .map((l) => (
                <Card key={l.language}>
                  <CardHeader>
                    <CardTitle>{l.name} — by category</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <CategoryRateChart data={l.categories.map((c) => ({ label: c.label, rate: c.verifiedPassRate, determinate: c.determinate }))} />
                    <Table>
                      <thead>
                        <tr>
                          <Th>Category</Th>
                          <Th className="text-right">Cases</Th>
                          <Th className="text-right">Passed</Th>
                          <Th className="text-right">Failed</Th>
                          <Th className="text-right">Review</Th>
                          <Th className="text-right">Pass rate</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {l.categories.map((c) => (
                          <tr key={c.category}>
                            <Td>{c.label}</Td>
                            <Td className="text-right tabular">{c.total}</Td>
                            <Td className="text-right tabular">{c.passed}</Td>
                            <Td className="text-right tabular">{c.failed}</Td>
                            <Td className="text-right tabular">{c.needsReview}</Td>
                            <Td className="text-right tabular">{formatPercent(c.verifiedPassRate)}</Td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </>
  );
}
