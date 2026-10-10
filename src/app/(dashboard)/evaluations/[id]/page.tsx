'use client';

import {
  Ban,
  CalendarClock,
  ChevronDown,
  CircleAlert,
  Cpu,
  Download,
  FileCheck2,
  FlaskConical,
  GitCompareArrows,
  RotateCw,
  Search,
  Timer,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';
import { Breadcrumbs } from '@/components/app/app-shell';
import { ConsistencyView } from '@/components/app/consistency-view';
import { CATEGORY_OPTIONS, FilterSelect, LANGUAGE_OPTIONS, Pagination } from '@/components/app/filters';
import { HeatLegend, PassRateHeatmap } from '@/components/app/heatmap';
import { EmptyState, ErrorState, LoadingRows, MetaItem, PageHeader } from '@/components/app/page';
import { ContourField } from '@/components/app/patterns';
import { ResultRow } from '@/components/app/result-row';
import { bucketCounts } from '@/components/app/run-list';
import { LanguageChip, RunStatusBadge, SimulatedBadge } from '@/components/app/status';
import { VerdictBar } from '@/components/app/viz';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/form-controls';
import { CodeBlock, Progress, Segmented, Table, Td, Th } from '@/components/ui/misc';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/overlays';
import { api, downloadFile, errorMessage, saveJson } from '@/lib/api/client';
import { isActive, useCancelRun, useRerun, useRun, useRunConsistency, useRunResults } from '@/lib/api/hooks';
import type { RunDetail } from '@/lib/api/types';
import { categoryLabel, LANGUAGES, VERDICT_LABELS, VERDICTS } from '@/lib/constants';
import { cn, durationBetween, formatDateTime, formatMs, formatNumber, formatPercent, shortId } from '@/lib/utils';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="contents">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{children}</dd>
    </div>
  );
}

function TabCount({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white/[0.07] px-1.5 py-px text-[11px] font-medium text-muted-foreground tabular">{children}</span>;
}

/* --------------------------------------------------------------- actions */

function RunActions({ run }: { run: RunDetail }) {
  const router = useRouter();
  const cancel = useCancelRun();
  const rerun = useRerun();
  const [busy, setBusy] = React.useState<string | null>(null);

  const exportAs = async (format: 'json' | 'csv' | 'markdown') => {
    setBusy(format);
    try {
      await downloadFile(`/reports/${run.id}/export`, { format }, `atlasguard-run.${format === 'markdown' ? 'md' : format}`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const evidence = async () => {
    setBusy('evidence');
    try {
      const bundle = await api.get<unknown>(`/reports/${run.id}/evidence`);
      saveJson(bundle, `atlasguard-natlas-evidence-${shortId(run.id)}.json`);
      toast.success('Integration evidence downloaded');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      {isActive(run.status) ? (
        <Button
          variant="secondary"
          loading={cancel.isPending}
          onClick={() => cancel.mutate(run.id, { onSuccess: () => toast.success('Cancellation requested'), onError: (e) => toast.error(errorMessage(e)) })}
        >
          <Ban /> Cancel
        </Button>
      ) : (
        <Button
          variant="secondary"
          loading={rerun.isPending}
          onClick={() =>
            rerun.mutate(run.id, {
              onSuccess: (next) => {
                toast.success('New run queued with the same settings');
                router.push(`/evaluations/${next.id}`);
              },
              onError: (e) => toast.error(errorMessage(e)),
            })
          }
        >
          <RotateCw /> Re-run
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" loading={!!busy}>
            <Download /> Export <ChevronDown className="text-subtle-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => void exportAs('json')}>Report (JSON)</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void exportAs('csv')}>Results (CSV)</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => void exportAs('markdown')}>Report (Markdown)</DropdownMenuItem>
          <DropdownMenuItem
            disabled={run.isSimulated || run.status !== 'COMPLETED'}
            onSelect={() => void evidence()}
            title={run.isSimulated ? 'Simulated runs cannot be exported as N-ATLaS evidence' : undefined}
          >
            <FileCheck2 /> N-ATLaS integration evidence
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button asChild variant="ghost">
        <Link href={`/reports?base=${run.id}`}>
          <GitCompareArrows /> Compare
        </Link>
      </Button>
    </>
  );
}

/* --------------------------------------------------------------- summary */

function LanguageLanes({ run }: { run: RunDetail }) {
  const langs = LANGUAGES.filter((l) => run.languages.includes(l.code));
  return (
    <ul className="flex flex-col gap-3.5">
      {langs.map((l) => {
        const b = run.summary?.byLanguage[l.code];
        return (
          <li key={l.code} className="grid grid-cols-[8.5rem_minmax(0,1fr)_4rem] items-center gap-3 sm:grid-cols-[10rem_minmax(0,1fr)_4.5rem_4rem]">
            <LanguageChip code={l.code} className="justify-self-start" />
            <VerdictBar counts={bucketCounts(b)} pending={b?.pending ?? 0} legend="none" size="sm" />
            <span className="text-right text-sm font-semibold tabular">{formatPercent(b?.verifiedPassRate ?? null)}</span>
            <span className="hidden text-right font-mono text-[11px] text-subtle-foreground sm:block">{formatMs(b?.averageLatencyMs ?? null)}</span>
          </li>
        );
      })}
    </ul>
  );
}

function SummaryCard({ run }: { run: RunDetail }) {
  const overall = run.summary?.overall;
  const v = run.progress.byVerdict;
  const contradictions = run.summary?.consistency.confirmedContradictions ?? 0;
  return (
    <Card className="overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="relative border-b border-border p-6 lg:border-r lg:border-b-0">
          <ContourField preset="panel" className="opacity-40" />
          <div className="relative">
            <div className="flex items-center justify-between gap-2">
              <span className="eyebrow">Verified pass rate</span>
              <span className="font-mono text-[11px] text-subtle-foreground">n={overall?.determinate ?? 0} decided</span>
            </div>
            <div className="mt-3 text-[52px] leading-none font-semibold tracking-[-0.04em]">{formatPercent(overall?.verifiedPassRate ?? null)}</div>
            <VerdictBar counts={v} pending={run.progress.pending + run.progress.running} size="lg" legendColumns={2} className="mt-6" />
          </div>
        </div>
        <div className="flex flex-col p-6">
          <div className="flex items-center justify-between gap-2">
            <span className="eyebrow">By language</span>
            <span className="hidden font-mono text-[11px] text-subtle-foreground sm:inline">verdicts · pass rate · avg latency</span>
          </div>
          <div className="mt-4">
            <LanguageLanes run={run} />
          </div>
          <dl className="mt-auto grid grid-cols-3 gap-4 border-t border-border pt-4 text-xs">
            <div>
              <dt className="text-muted-foreground">Avg latency</dt>
              <dd className="mt-1 text-[15px] font-semibold">{formatMs(overall?.averageLatencyMs ?? null)}</dd>
              <dd className="text-[11px] text-subtle-foreground">median {formatMs(overall?.medianLatencyMs ?? null)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Contradictions</dt>
              <dd className={cn('mt-1 text-[15px] font-semibold', contradictions > 0 && 'text-red-300')}>{formatNumber(contradictions)}</dd>
              <dd className="text-[11px] text-subtle-foreground">{run.summary?.consistency.groups ?? 0} groups compared</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Errors / skipped</dt>
              <dd className="mt-1 text-[15px] font-semibold">
                {v.ERROR ?? 0} / {v.SKIPPED ?? 0}
              </dd>
              <dd className="text-[11px] text-subtle-foreground">Technical — not failures</dd>
            </div>
          </dl>
        </div>
      </div>
    </Card>
  );
}

function LiveProgress({ run }: { run: RunDetail }) {
  const pct = run.progress.total ? (run.progress.done / run.progress.total) * 100 : 0;
  return (
    <Card variant="featured" className="mb-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2.5 text-sm font-medium">
          <span className="relative flex size-2" aria-hidden>
            <span className="absolute inset-0 rounded-full bg-violet-400 animate-ping-slow" />
            <span className="relative size-2 rounded-full bg-violet-400" />
          </span>
          {run.status === 'QUEUED' ? 'Waiting for the evaluation worker…' : `Evaluating case ${Math.min(run.progress.done + 1, run.progress.total)} of ${run.progress.total}`}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {run.progress.done}/{run.progress.total} done · {run.progress.running} in progress · {Math.round(pct)}%
        </span>
      </div>
      <Progress value={pct} active label="Evaluation progress" className="mt-3.5 h-2" />
      <p className="mt-3 text-xs text-muted-foreground">
        Cases run in the background. You can leave this page — progress is saved and the run resumes if the server restarts.
        {run.cancelRequestedAt && ' Cancellation requested; the run stops after in-flight cases finish.'}
      </p>
    </Card>
  );
}

/* ------------------------------------------------------------------ tabs */

function ResultsTab({ run }: { run: RunDetail }) {
  const [language, setLanguage] = React.useState<string>();
  const [verdict, setVerdict] = React.useState<string>('all');
  const [category, setCategory] = React.useState<string>();
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const results = useRunResults(
    run.id,
    { language, verdict: verdict === 'all' ? undefined : verdict, category, search: search || undefined, page, pageSize: 25 },
    isActive(run.status),
  );
  React.useEffect(() => setPage(1), [language, verdict, category, search]);
  const byVerdict = run.progress.byVerdict;

  return (
    <>
      <div className="mb-4 flex flex-col gap-3">
        <Segmented
          label="Filter by verdict"
          value={verdict}
          onChange={setVerdict}
          options={[
            { value: 'all', label: 'All', count: run.progress.total },
            ...VERDICTS.filter((v) => (byVerdict[v] ?? 0) > 0).map((v) => ({ value: v, label: VERDICT_LABELS[v], count: byVerdict[v] ?? 0 })),
          ]}
          className="self-start"
        />
        <div className="flex flex-wrap gap-2">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-3 left-3 size-4 text-subtle-foreground" aria-hidden />
            <Input placeholder="Search prompts and responses" aria-label="Search results" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <FilterSelect label="Language" value={language} onChange={setLanguage} options={LANGUAGE_OPTIONS.filter((l) => run.languages.includes(l.value))} />
          <FilterSelect label="Category" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} className="w-56" />
        </div>
      </div>
      {results.isLoading && <LoadingRows />}
      {results.error && <ErrorState error={results.error} onRetry={() => void results.refetch()} />}
      {results.data && results.data.items.length === 0 && <EmptyState icon={Search} title="No results match these filters" />}
      <ul className={cn('flex flex-col gap-2', results.isPlaceholderData && 'opacity-60')}>
        {results.data?.items.map((r) => (
          <ResultRow key={r.id} result={r} runId={run.id} />
        ))}
      </ul>
      <Pagination meta={results.data?.meta} onPage={setPage} />
    </>
  );
}

function LanguagesTab({ run }: { run: RunDetail }) {
  const summary = run.summary;
  if (!summary) return <p className="text-sm text-muted-foreground">No results yet.</p>;
  const langs = LANGUAGES.filter((l) => run.languages.includes(l.code));
  const categories = Object.keys(summary.byCategory);
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader action={<HeatLegend className="hidden xl:flex" />}>
          <CardTitle>Category × language</CardTitle>
          <CardDescription>Verified pass rate in each cell, with the number of decided cases.</CardDescription>
        </CardHeader>
        <CardContent>
          <PassRateHeatmap
            languages={langs.map((l) => ({ code: l.code, name: l.name, evaluated: true }))}
            categories={categories.map((c) => ({ key: c, label: categoryLabel(c) }))}
            cell={(c, l) => summary.byLanguageCategory[l]?.[c]}
          />
          <HeatLegend className="mt-4 xl:hidden" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Per-language breakdown</CardTitle>
        </CardHeader>
        <CardContent className="px-2">
          <Table>
            <thead>
              <tr>
                <Th>Language</Th>
                <Th className="text-right">Cases</Th>
                <Th className="text-right">Passed</Th>
                <Th className="text-right">Failed</Th>
                <Th className="text-right">Needs review</Th>
                <Th className="text-right">Errors</Th>
                <Th className="text-right">Pass rate</Th>
                <Th className="text-right">Avg latency</Th>
              </tr>
            </thead>
            <tbody>
              {langs.map((l) => {
                const b = summary.byLanguage[l.code];
                return (
                  <tr key={l.code} className="hover:bg-white/[0.02]">
                    <Td>
                      <LanguageChip code={l.code} />
                    </Td>
                    <Td className="text-right tabular">{b?.total ?? 0}</Td>
                    <Td className="text-right tabular">{b?.passed ?? 0}</Td>
                    <Td className="text-right tabular">{b?.failed ?? 0}</Td>
                    <Td className="text-right tabular">{b?.needsReview ?? 0}</Td>
                    <Td className="text-right tabular">{b?.errors ?? 0}</Td>
                    <Td className="text-right font-medium tabular">{formatPercent(b?.verifiedPassRate ?? null)}</Td>
                    <Td className="text-right font-mono text-xs text-muted-foreground">{formatMs(b?.averageLatencyMs ?? null)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ProvenanceTab({ run: r }: { run: RunDetail }) {
  const modelInfo = r.providerMetadata?.modelInfo;
  const durationMs = durationBetween(r.startedAt, r.completedAt);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Model</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[9rem_1fr] gap-x-3 gap-y-2 text-[13px]">
              <Info label="Model">
                <span className="font-mono">{r.modelIdentifier}</span>
              </Info>
              <Info label="Revision">
                <span className="font-mono text-xs">{r.modelRevision ?? 'not reported'}</span>
              </Info>
              <Info label="Provider">{r.isSimulated ? 'Development fixtures (simulated)' : r.modelConfiguration.name}</Info>
              {modelInfo && (
                <>
                  <Info label="Served model">
                    <span className="font-mono text-xs">{modelInfo.servedModel ?? '—'}</span>
                  </Info>
                  <Info label="Runtime">
                    {[modelInfo.dtype, modelInfo.quantization && modelInfo.quantization !== 'none' ? `${modelInfo.quantization} quantization` : null, modelInfo.device, modelInfo.runtime]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </Info>
                </>
              )}
              <Info label="Parameters">
                temperature {r.inferenceConfig.temperature} · max tokens {r.inferenceConfig.maxTokens}
                {r.inferenceConfig.repetitionPenalty !== null && ` · repetition penalty ${r.inferenceConfig.repetitionPenalty}`}
                {r.inferenceConfig.topP !== null && ` · top-p ${r.inferenceConfig.topP}`}
                {r.inferenceConfig.seed !== null && ` · seed ${r.inferenceConfig.seed}`}
              </Info>
              <Info label="System prompt">
                <span className="text-xs text-muted-foreground">{r.inferenceConfig.systemPrompt ?? 'none'}</span>
              </Info>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Benchmark & execution</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[9rem_1fr] gap-x-3 gap-y-2 text-[13px]">
              <Info label="Suite">
                <Link href={`/benchmarks/${r.suite.id}`} className="hover:underline">
                  {r.suite.name}
                </Link>{' '}
                v{r.benchmarkVersion}
              </Info>
              <Info label="Content hash">
                <span className="font-mono text-xs">{r.benchmarkContentHash.slice(0, 24)}…</span>
              </Info>
              <Info label="Selection">
                {r.selection.categories?.length ? r.selection.categories.map(categoryLabel).join(', ') : 'All categories'}
                {r.selection.onlyVerified ? ' · verified only' : ''} · {r.totalCases} cases
              </Info>
              <Info label="Evaluator">v{r.evaluatorVersion}</Info>
              <Info label="Queued">{formatDateTime(r.queuedAt)}</Info>
              <Info label="Started → done">
                {formatDateTime(r.startedAt)} → {formatDateTime(r.completedAt)}
              </Info>
              <Info label="Duration">{formatMs(durationMs)}</Info>
            </dl>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <CodeBlock title="inference-config.json" code={JSON.stringify(r.inferenceConfig, null, 2)} />
        <CodeBlock title="provider-metadata.json" code={JSON.stringify(r.providerMetadata ?? { note: 'recorded when the run starts' }, null, 2)} />
        <CodeBlock
          title="reproducibility.json"
          code={JSON.stringify(
            {
              runId: r.id,
              benchmark: { slug: r.suite.slug, version: r.benchmarkVersion, contentHash: r.benchmarkContentHash },
              model: { identifier: r.modelIdentifier, revision: r.modelRevision, providerType: r.providerType, simulated: r.isSimulated },
              evaluatorVersion: r.evaluatorVersion,
              languages: r.languages,
              selection: r.selection,
            },
            null,
            2,
          )}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ page */

export default function RunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const run = useRun(id);
  const [tab, setTab] = React.useState('results');
  const consistency = useRunConsistency(id, tab === 'consistency' && !isActive(run.data?.status));

  if (run.isLoading) return <LoadingRows rows={6} />;
  if (run.error || !run.data) return <ErrorState error={run.error} onRetry={() => void run.refetch()} />;
  const r = run.data;
  const durationMs = durationBetween(r.startedAt, r.completedAt);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Evaluations', href: '/evaluations' },
          { label: r.project.name, href: `/projects/${r.project.id}` },
          { label: `${r.suite.name} #${shortId(r.id)}` },
        ]}
      />
      <PageHeader
        eyebrow={
          <>
            <span>Run</span>
            <span className="text-muted-foreground">#{shortId(r.id)}</span>
          </>
        }
        title={r.suite.name}
        meta={
          <>
            <span className="flex items-center gap-1.5">
              <RunStatusBadge status={r.status} />
              {r.isSimulated && <SimulatedBadge />}
            </span>
            <span className="flex flex-wrap gap-1">
              {LANGUAGES.filter((l) => r.languages.includes(l.code)).map((l) => (
                <LanguageChip key={l.code} code={l.code} compact />
              ))}
            </span>
            <MetaItem icon={Cpu}>
              <span className="font-mono">{r.modelIdentifier}</span>
            </MetaItem>
            <MetaItem icon={User}>{r.createdBy.name}</MetaItem>
            <MetaItem icon={CalendarClock}>{formatDateTime(r.createdAt)}</MetaItem>
            {durationMs !== null && <MetaItem icon={Timer}>{formatMs(durationMs)}</MetaItem>}
          </>
        }
        actions={<RunActions run={r} />}
      />

      {r.isSimulated && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-[linear-gradient(90deg,rgb(245_158_11/0.1),rgb(245_158_11/0.03))] px-4 py-3 text-sm text-amber-100/90">
          <FlaskConical className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden />
          <span>
            <strong className="text-amber-200">Simulated run.</strong> These responses are AtlasGuard development fixtures, not N-ATLaS output. Scores here only
            demonstrate the evaluation pipeline; integration-evidence export is disabled.
          </span>
        </div>
      )}
      {r.errorDetails && (
        <div role="alert" className="mb-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-danger-soft px-4 py-3 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-red-300" aria-hidden />
          <span>
            <span className="font-mono text-xs text-red-200">{r.errorDetails.code}</span>
            <span className="block text-red-100">{r.errorDetails.message}</span>
          </span>
        </div>
      )}

      {isActive(r.status) && <LiveProgress run={r} />}

      <SummaryCard run={r} />

      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <TabsList>
          <TabsTrigger value="results">
            Results <TabCount>{r.totalCases}</TabCount>
          </TabsTrigger>
          <TabsTrigger value="consistency">
            <GitCompareArrows /> Cross-language
            {(r.summary?.consistency.confirmedContradictions ?? 0) > 0 && (
              <span className="rounded-full bg-danger-soft px-1.5 py-px text-[11px] font-medium text-red-300 tabular">{r.summary!.consistency.confirmedContradictions}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="provenance">Provenance</TabsTrigger>
        </TabsList>
        <TabsContent value="results">
          <ResultsTab run={r} />
        </TabsContent>
        <TabsContent value="consistency">
          {isActive(r.status) ? (
            <p className="text-sm text-muted-foreground">Cross-language analysis runs when the evaluation completes.</p>
          ) : consistency.isLoading ? (
            <LoadingRows />
          ) : consistency.error ? (
            <ErrorState error={consistency.error} onRetry={() => void consistency.refetch()} />
          ) : (
            <ConsistencyView groups={consistency.data ?? []} />
          )}
        </TabsContent>
        <TabsContent value="languages">
          <LanguagesTab run={r} />
        </TabsContent>
        <TabsContent value="provenance">
          <ProvenanceTab run={r} />
        </TabsContent>
      </Tabs>
    </>
  );
}
