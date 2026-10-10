'use client';

import {
  Ban,
  ChevronDown,
  CircleAlert,
  Download,
  FileCheck2,
  FlaskConical,
  GitCompareArrows,
  RotateCw,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';
import { ConsistencyView } from '@/components/app/consistency-view';
import { CATEGORY_OPTIONS, FilterSelect, LANGUAGE_OPTIONS, Pagination, VERDICT_OPTIONS } from '@/components/app/filters';
import { EmptyState, ErrorState, LoadingRows, PageHeader, StatTile } from '@/components/app/page';
import { ResultRow } from '@/components/app/result-row';
import { RunStatusBadge, SimulatedBadge } from '@/components/app/status';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/form-controls';
import { CodeBlock, Progress, Table, Td, Th } from '@/components/ui/misc';
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
import { categoryLabel, languageName, LANGUAGES } from '@/lib/constants';
import { cn, durationBetween, formatDateTime, formatMs, formatNumber, formatPercent, shortId } from '@/lib/utils';

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="contents">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{children}</dd>
    </div>
  );
}

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
      {isActive(run.status) && (
        <Button
          variant="secondary"
          loading={cancel.isPending}
          onClick={() => cancel.mutate(run.id, { onSuccess: () => toast.success('Cancellation requested'), onError: (e) => toast.error(errorMessage(e)) })}
        >
          <Ban /> Cancel
        </Button>
      )}
      {!isActive(run.status) && (
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
            <Download /> Export <ChevronDown />
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

function ResultsTab({ run }: { run: RunDetail }) {
  const [language, setLanguage] = React.useState<string>();
  const [verdict, setVerdict] = React.useState<string>();
  const [category, setCategory] = React.useState<string>();
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const results = useRunResults(run.id, { language, verdict, category, search: search || undefined, page, pageSize: 25 }, isActive(run.status));
  React.useEffect(() => setPage(1), [language, verdict, category, search]);

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-subtle-foreground" aria-hidden />
          <Input placeholder="Search prompts and responses" aria-label="Search results" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <FilterSelect label="Language" value={language} onChange={setLanguage} options={LANGUAGE_OPTIONS.filter((l) => run.languages.includes(l.value))} />
        <FilterSelect label="Verdict" value={verdict} onChange={setVerdict} options={VERDICT_OPTIONS} />
        <FilterSelect label="Category" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} className="w-56" />
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
  const categories = Object.keys(summary.byCategory);
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="pt-2">
          <Table>
            <thead>
              <tr>
                <Th>Language</Th>
                <Th className="text-right">Cases</Th>
                <Th className="text-right">Passed</Th>
                <Th className="text-right">Failed</Th>
                <Th className="text-right">Needs review</Th>
                <Th className="text-right">Errors</Th>
                <Th className="text-right">Verified pass rate</Th>
                <Th className="text-right">Avg latency</Th>
              </tr>
            </thead>
            <tbody>
              {LANGUAGES.filter((l) => run.languages.includes(l.code)).map((l) => {
                const b = summary.byLanguage[l.code];
                return (
                  <tr key={l.code}>
                    <Td className="font-medium">{l.name}</Td>
                    <Td className="text-right tabular">{b?.total ?? 0}</Td>
                    <Td className="text-right tabular">{b?.passed ?? 0}</Td>
                    <Td className="text-right tabular">{b?.failed ?? 0}</Td>
                    <Td className="text-right tabular">{b?.needsReview ?? 0}</Td>
                    <Td className="text-right tabular">{b?.errors ?? 0}</Td>
                    <Td className="text-right tabular">{formatPercent(b?.verifiedPassRate ?? null)}</Td>
                    <Td className="text-right tabular">{formatMs(b?.averageLatencyMs ?? null)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Verified pass rate by category and language</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <thead>
              <tr>
                <Th>Category</Th>
                {LANGUAGES.filter((l) => run.languages.includes(l.code)).map((l) => (
                  <Th key={l.code} className="text-right">
                    {l.name}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c}>
                  <Td>{categoryLabel(c)}</Td>
                  {LANGUAGES.filter((l) => run.languages.includes(l.code)).map((l) => {
                    const b = summary.byLanguageCategory[l.code]?.[c];
                    return (
                      <Td key={l.code} className="text-right tabular">
                        {b ? (
                          <>
                            {formatPercent(b.verifiedPassRate)}
                            <span className="ml-1 text-xs text-subtle-foreground">n={b.determinate}</span>
                          </>
                        ) : (
                          '—'
                        )}
                      </Td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const run = useRun(id);
  const [tab, setTab] = React.useState('results');
  const consistency = useRunConsistency(id, tab === 'consistency' && !isActive(run.data?.status));

  if (run.isLoading) return <LoadingRows rows={6} />;
  if (run.error || !run.data) return <ErrorState error={run.error} onRetry={() => void run.refetch()} />;
  const r = run.data;
  const overall = r.summary?.overall;
  const progressPct = r.progress.total ? (r.progress.done / r.progress.total) * 100 : 0;
  const modelInfo = r.providerMetadata?.modelInfo;
  const durationMs = durationBetween(r.startedAt, r.completedAt);

  return (
    <>
      <PageHeader
        eyebrow={
          <span>
            <Link href="/evaluations" className="hover:text-foreground">
              Evaluations
            </Link>{' '}
            /{' '}
            <Link href={`/projects/${r.project.id}`} className="hover:text-foreground">
              {r.project.name}
            </Link>
          </span>
        }
        title={
          <span className="flex flex-wrap items-center gap-2">
            {r.suite.name} <span className="font-mono text-sm font-normal text-subtle-foreground">#{shortId(r.id)}</span>
            <RunStatusBadge status={r.status} />
            {r.isSimulated && <SimulatedBadge />}
          </span>
        }
        description={`${r.languages.map(languageName).join(' · ')} · started by ${r.createdBy.name} · ${formatDateTime(r.createdAt)}`}
        actions={<RunActions run={r} />}
      />

      {r.isSimulated && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-amber-100">
          <FlaskConical className="mt-0.5 size-4 shrink-0" />
          <span>
            <strong>Simulated run.</strong> These responses are AtlasGuard development fixtures, not N-ATLaS output. Scores here only
            demonstrate the evaluation pipeline; integration-evidence export is disabled.
          </span>
        </div>
      )}
      {r.errorDetails && (
        <div role="alert" className="mb-4 flex items-start gap-2 rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-red-300" />
          <span>
            <span className="font-mono text-xs text-red-200">{r.errorDetails.code}</span>
            <span className="block text-red-100">{r.errorDetails.message}</span>
          </span>
        </div>
      )}

      {isActive(r.status) && (
        <Card className="mb-4">
          <CardContent className="pt-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium">
                {r.status === 'QUEUED' ? 'Waiting for the evaluation worker…' : `Evaluating case ${Math.min(r.progress.done + 1, r.progress.total)} of ${r.progress.total}`}
              </span>
              <span className="text-muted-foreground tabular">
                {r.progress.done}/{r.progress.total} done · {r.progress.running} in progress
              </span>
            </div>
            <Progress value={progressPct} label="Evaluation progress" />
            <p className="mt-2 text-xs text-muted-foreground">
              Cases run in the background. You can leave this page — progress is saved and the run resumes if the server restarts.
              {r.cancelRequestedAt && ' Cancellation requested; the run stops after in-flight cases finish.'}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <StatTile label="Verified pass rate" value={formatPercent(overall?.verifiedPassRate ?? null)} hint={overall ? `n=${overall.determinate} decided` : undefined} />
        <StatTile label="Passed" value={formatNumber(r.progress.byVerdict.PASSED ?? 0)} tone="success" />
        <StatTile label="Failed" value={formatNumber(r.progress.byVerdict.FAILED ?? 0)} tone={r.progress.byVerdict.FAILED ? 'danger' : 'default'} />
        <StatTile label="Needs review" value={formatNumber(r.progress.byVerdict.NEEDS_REVIEW ?? 0)} tone={r.progress.byVerdict.NEEDS_REVIEW ? 'warning' : 'default'} />
        <StatTile label="Errors / skipped" value={`${r.progress.byVerdict.ERROR ?? 0} / ${r.progress.byVerdict.SKIPPED ?? 0}`} hint="Technical — not failures" />
        <StatTile label="Avg latency" value={formatMs(overall?.averageLatencyMs ?? null)} hint={`median ${formatMs(overall?.medianLatencyMs ?? null)}`} />
        <StatTile
          label="Contradictions"
          value={formatNumber(r.summary?.consistency.confirmedContradictions ?? 0)}
          hint={`${r.summary?.consistency.groups ?? 0} groups compared`}
          tone={r.summary?.consistency.confirmedContradictions ? 'danger' : 'default'}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Model</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[9rem_1fr] gap-x-3 gap-y-1.5 text-sm">
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
                  <Info label="Runtime">{[modelInfo.dtype, modelInfo.quantization && modelInfo.quantization !== 'none' ? `${modelInfo.quantization} quantization` : null, modelInfo.device, modelInfo.runtime].filter(Boolean).join(' · ') || '—'}</Info>
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
            <dl className="grid grid-cols-[9rem_1fr] gap-x-3 gap-y-1.5 text-sm">
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

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="consistency">
            <GitCompareArrows /> Cross-language
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
          <div className="grid gap-4 lg:grid-cols-2">
            <CodeBlock language="inference configuration" code={JSON.stringify(r.inferenceConfig, null, 2)} />
            <CodeBlock language="provider metadata" code={JSON.stringify(r.providerMetadata ?? { note: 'recorded when the run starts' }, null, 2)} />
            <CodeBlock
              language="reproducibility"
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
        </TabsContent>
      </Tabs>
    </>
  );
}
