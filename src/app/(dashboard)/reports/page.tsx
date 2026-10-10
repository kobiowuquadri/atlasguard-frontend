'use client';

import { ArrowDownRight, ArrowRight, ArrowUpRight, Download, FileCheck2, FileText, FlaskConical, Minus } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';
import { EmptyState, ErrorState, LoadingRows, PageHeader } from '@/components/app/page';
import { LanguageChip, SimulatedBadge, VerdictBadge } from '@/components/app/status';
import { VerdictBar } from '@/components/app/viz';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Td, Th } from '@/components/ui/misc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/overlays';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, downloadFile, errorMessage, saveJson } from '@/lib/api/client';
import { useCompare, useReport, useRuns } from '@/lib/api/hooks';
import type { CompareRow, Run } from '@/lib/api/types';
import { cn, formatDateTime, formatMs, formatPercent, shortId } from '@/lib/utils';

function runLabel(r: Run) {
  return `${r.suite.name} #${shortId(r.id)} · ${new Date(r.createdAt).toLocaleDateString('en-NG')}${r.isSimulated ? ' · simulated' : ''}`;
}

function RunPicker({ runs, value, onChange, label, className }: { runs: Run[]; value?: string; onChange: (v: string) => void; label: string; className?: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className={cn('max-w-md', className)}>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {runs.map((r) => (
          <SelectItem key={r.id} value={r.id}>
            {runLabel(r)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Delta({ value, kind }: { value: number | null; kind: 'rate' | 'ms' }) {
  if (value === null) return <span className="text-subtle-foreground">—</span>;
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-muted-foreground">
        <Minus className="size-3.5" /> 0
      </span>
    );
  }
  // For pass rate up is good; for latency down is good. Direction is shown by icon and sign, not colour alone.
  const good = kind === 'rate' ? value > 0 : value < 0;
  const Icon = value > 0 ? ArrowUpRight : ArrowDownRight;
  const text = kind === 'rate' ? `${value > 0 ? '+' : ''}${(value * 100).toFixed(1)} pts` : `${value > 0 ? '+' : ''}${Math.round(value)} ms`;
  return (
    <span className={cn('inline-flex items-center gap-1 tabular', good ? 'text-green-300' : 'text-red-300')}>
      <Icon className="size-3.5" aria-hidden /> {text}
    </span>
  );
}

/** Inline magnitude bar for table rows (single hue, 0–100%). */
function RateCell({ rate }: { rate: number | null }) {
  return (
    <span className="flex items-center justify-end gap-3">
      <span className="hidden h-1.5 w-20 rounded-full bg-white/[0.06] sm:block" aria-hidden>
        {rate !== null && <span className="block h-full rounded-full bg-[#8b5cf6]" style={{ width: `${Math.max(rate * 100, 2)}%` }} />}
      </span>
      <span className="w-14 text-right font-medium tabular">{formatPercent(rate)}</span>
    </span>
  );
}

function CompareTable({ rows, title }: { rows: CompareRow[]; title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        <Table>
          <thead>
            <tr>
              <Th />
              <Th className="text-right">Base</Th>
              <Th className="text-right">Target</Th>
              <Th className="text-right">Change</Th>
              <Th className="text-right">Latency</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="hover:bg-white/[0.02]">
                <Td>{r.label}</Td>
                <Td className="text-right tabular">{formatPercent(r.base?.verifiedPassRate ?? null)}</Td>
                <Td className="text-right tabular">{formatPercent(r.target?.verifiedPassRate ?? null)}</Td>
                <Td className="text-right">
                  <Delta value={r.passRateDelta} kind="rate" />
                </Td>
                <Td className="text-right">
                  <Delta value={r.latencyDeltaMs} kind="ms" />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ReportPanel({ runId }: { runId: string }) {
  const report = useReport(runId);
  const [busy, setBusy] = React.useState<string | null>(null);
  if (report.isLoading) return <LoadingRows />;
  if (report.error || !report.data) return <ErrorState error={report.error} onRetry={() => void report.refetch()} />;
  const r = report.data;

  const download = async (format: 'json' | 'csv' | 'markdown') => {
    setBusy(format);
    try {
      await downloadFile(`/reports/${runId}/export`, { format });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };
  const evidence = async () => {
    setBusy('evidence');
    try {
      saveJson(await api.get(`/reports/${runId}/evidence`), `atlasguard-natlas-evidence-${shortId(runId)}.json`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const s = r.summary;
  const metrics: Array<[string, React.ReactNode, string?]> = [
    ['Passed / failed', `${s.passed} / ${s.failed}`],
    ['Needs review', s.needsReview, 'Routed to a fluent reviewer'],
    ['Errors / skipped', `${s.errors} / ${s.skipped}`, 'Technical — not failures'],
    ['Avg latency', formatMs(s.averageLatencyMs), `median ${formatMs(s.medianLatencyMs)}`],
    ['Contradictions', r.consistency.confirmedContradictions, `${r.consistency.groupsCompared} groups compared`],
  ];

  return (
    <div className="flex flex-col gap-4">
      {r.simulated && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-400/20 bg-warning-soft px-4 py-3 text-sm text-amber-100/90">
          <FlaskConical className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden />
          <p>{r.simulationNotice}</p>
        </div>
      )}

      {/* Report "document" */}
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="min-w-0">
            <div className="eyebrow">Evaluation report</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-lg font-semibold tracking-tight">
              {r.overview.benchmark.name} <span className="font-mono text-sm font-normal text-subtle-foreground">v{r.overview.benchmark.version}</span>
              {r.simulated && <SimulatedBadge />}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span>{r.overview.project.name}</span>
              <span aria-hidden>·</span>
              <span className="font-mono">{r.overview.model.modelIdentifier}</span>
              <span aria-hidden>·</span>
              <span>completed {formatDateTime(r.overview.run.completedAt)}</span>
              <span aria-hidden>·</span>
              <span className="font-mono">#{shortId(r.overview.run.id)}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['json', 'csv', 'markdown'] as const).map((f) => (
              <Button key={f} variant="secondary" size="sm" loading={busy === f} onClick={() => void download(f)}>
                <Download /> {f === 'markdown' ? 'Markdown' : f.toUpperCase()}
              </Button>
            ))}
            <Button size="sm" disabled={r.simulated || r.overview.run.status !== 'COMPLETED'} loading={busy === 'evidence'} onClick={() => void evidence()}>
              <FileCheck2 /> N-ATLaS evidence
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="border-b border-border p-6 lg:border-r lg:border-b-0">
            <div className="eyebrow">Verified pass rate</div>
            <div className="mt-3 text-[48px] leading-none font-semibold tracking-[-0.04em]">{formatPercent(s.verifiedPassRate)}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              {s.passed + s.failed} decided of {s.total} cases · {s.humanReviewed} human-reviewed
            </p>
            <VerdictBar
              counts={{ PASSED: s.passed, FAILED: s.failed, NEEDS_REVIEW: s.needsReview, ERROR: s.errors, SKIPPED: s.skipped }}
              pending={s.pending}
              size="lg"
              legendColumns={2}
              className="mt-6"
            />
          </div>
          <dl className="grid auto-rows-fr grid-cols-2 gap-px bg-border sm:grid-cols-3">
            {metrics.map(([label, value, hint]) => (
              <div key={label} className="bg-card px-5 py-4">
                <dt className="eyebrow">{label}</dt>
                <dd className="mt-2 text-xl leading-none font-semibold">{value}</dd>
                {hint && <dd className="mt-1.5 text-[11px] text-subtle-foreground">{hint}</dd>}
              </div>
            ))}
            <div className="bg-card px-5 py-4">
              <dt className="eyebrow">Languages</dt>
              <dd className="mt-2 flex flex-wrap gap-1">
                {r.overview.languages.map((l) => (
                  <LanguageChip key={l} code={l} compact />
                ))}
              </dd>
            </div>
          </dl>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Language performance</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <Table>
              <thead>
                <tr>
                  <Th>Language</Th>
                  <Th className="text-right">Cases</Th>
                  <Th className="text-right">Pass rate</Th>
                  <Th className="text-right">Latency</Th>
                </tr>
              </thead>
              <tbody>
                {r.languagePerformance.map((l) => (
                  <tr key={l.language} className="hover:bg-white/[0.02]">
                    <Td>
                      <LanguageChip code={l.language} />
                    </Td>
                    <Td className="text-right tabular">{l.total}</Td>
                    <Td>
                      <RateCell rate={l.verifiedPassRate} />
                    </Td>
                    <Td className="text-right font-mono text-xs text-muted-foreground">{formatMs(l.averageLatencyMs)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Category performance</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <Table>
              <thead>
                <tr>
                  <Th>Category</Th>
                  <Th className="text-right">Cases</Th>
                  <Th className="text-right">Pass rate</Th>
                </tr>
              </thead>
              <tbody>
                {r.categoryPerformance.map((c) => (
                  <tr key={c.category} className="hover:bg-white/[0.02]">
                    <Td>{c.label}</Td>
                    <Td className="text-right tabular">{c.total}</Td>
                    <Td>
                      <RateCell rate={c.verifiedPassRate} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Methodology & limitations</CardTitle>
          <CardDescription>How every number in this report was produced.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <dl className="flex flex-col gap-3 text-[13px]">
            {Object.entries(r.methodology).map(([k, v]) => (
              <div key={k} className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-4">
                <dt className="font-medium text-foreground capitalize">{k.replace(/([A-Z])/g, ' $1')}</dt>
                <dd className="leading-relaxed text-muted-foreground">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="rounded-xl border border-border bg-inset p-4">
            <div className="eyebrow mb-2.5">Limitations</div>
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-[13px] leading-relaxed text-muted-foreground">
              {r.limitations.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        </CardContent>
        <p className="border-t border-border px-5 py-3 text-[11px] text-subtle-foreground">{r.attribution}</p>
      </Card>
      <p className="text-xs text-muted-foreground">
        Full per-case findings are in the{' '}
        <Link href={`/evaluations/${runId}`} className="inline-flex items-center gap-1 text-violet-300 hover:underline">
          run details <ArrowRight className="size-3" />
        </Link>{' '}
        and the exports.
      </p>
    </div>
  );
}

function ComparePanel({ runs, initialBase }: { runs: Run[]; initialBase?: string }) {
  const [base, setBase] = React.useState<string | undefined>(initialBase);
  const [target, setTarget] = React.useState<string>();
  const compare = useCompare(base, target);
  const baseRun = runs.find((r) => r.id === base);
  const compatible = baseRun ? runs.filter((r) => r.id !== base && r.suite.slug === baseRun.suite.slug) : [];

  return (
    <div className="flex flex-col gap-4">
      <Card className="grid gap-4 p-5 md:grid-cols-[1fr_auto_1fr] md:items-end">
        <div className="flex flex-col gap-2">
          <span className="eyebrow">Base run</span>
          <RunPicker
            runs={runs}
            value={base}
            onChange={(v) => {
              setBase(v);
              setTarget(undefined);
            }}
            label="Select base run"
            className="max-w-none"
          />
        </div>
        <ArrowRight className="mx-auto hidden size-4 text-subtle-foreground md:mb-3 md:block" aria-hidden />
        <div className="flex flex-col gap-2">
          <span className="eyebrow">Target run · same benchmark suite</span>
          <RunPicker runs={compatible} value={target} onChange={setTarget} label={base ? 'Select target run' : 'Select a base run first'} className="max-w-none" />
        </div>
      </Card>
      {compare.isLoading && <LoadingRows />}
      {compare.error && <ErrorState error={compare.error} />}
      {compare.data && (
        <>
          {compare.data.warnings.length > 0 && (
            <ul className="rounded-xl border border-amber-400/20 bg-warning-soft px-4 py-3 text-sm text-amber-100">
              {compare.data.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border shadow-card md:grid-cols-4">
            {(
              [
                ['Base pass rate', formatPercent(compare.data.base.overall.verifiedPassRate)],
                ['Target pass rate', formatPercent(compare.data.target.overall.verifiedPassRate)],
                ['Change', <Delta key="d" value={compare.data.overall.passRateDelta} kind="rate" />],
                ['Cases compared', `${compare.data.casesCompared}`],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="bg-card px-5 py-4">
                <div className="eyebrow">{label}</div>
                <div className="mt-2 text-xl leading-none font-semibold">{value}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <CompareTable rows={compare.data.byLanguage} title="By language" />
            <CompareTable rows={compare.data.byCategory} title="By category" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Verdict changes</CardTitle>
              <CardDescription>{compare.data.caseChanges.length} case(s) changed their final verdict</CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              {compare.data.caseChanges.length === 0 ? (
                <p className="px-3 pb-2 text-sm text-muted-foreground">No case changed its final verdict.</p>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Case</Th>
                      <Th>Language</Th>
                      <Th>Base</Th>
                      <Th>Target</Th>
                      <Th>Direction</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {compare.data.caseChanges.map((c) => (
                      <tr key={`${c.caseKey}-${c.language}`} className="hover:bg-white/[0.02]">
                        <Td className="font-mono text-xs">{c.caseKey}</Td>
                        <Td>
                          <LanguageChip code={c.language} compact />
                        </Td>
                        <Td>
                          <VerdictBadge verdict={c.base} />
                        </Td>
                        <Td>
                          <VerdictBadge verdict={c.target} />
                        </Td>
                        <Td className="text-[13px] capitalize">{c.direction}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function ReportsContent() {
  const params = useSearchParams();
  const initialBase = params.get('base') ?? undefined;
  const runs = useRuns({ pageSize: 100 });
  const finished = (runs.data?.items ?? []).filter((r) => ['COMPLETED', 'FAILED', 'CANCELLED'].includes(r.status));
  const [selected, setSelected] = React.useState<string | undefined>(initialBase);

  React.useEffect(() => {
    if (!selected && finished.length > 0) setSelected(finished[0]!.id);
  }, [finished, selected]);

  return (
    <>
      <PageHeader
        title="Reports"
        description="Summaries built only from stored evaluation records. Download JSON, CSV or Markdown, compare two runs, or export N-ATLaS integration evidence."
      />
      {runs.isLoading && <LoadingRows />}
      {runs.error && <ErrorState error={runs.error} onRetry={() => void runs.refetch()} />}
      {runs.data && finished.length === 0 && <EmptyState icon={FileText} title="No finished runs yet" description="Reports appear once an evaluation run has completed." />}
      {finished.length > 0 && (
        <Tabs defaultValue={initialBase ? 'compare' : 'report'}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList variant="pill">
              <TabsTrigger value="report">Run report</TabsTrigger>
              <TabsTrigger value="compare">Compare runs</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="report">
            <div className="mb-4">
              <RunPicker runs={finished} value={selected} onChange={setSelected} label="Select a run" />
            </div>
            {selected && <ReportPanel runId={selected} />}
          </TabsContent>
          <TabsContent value="compare">
            <ComparePanel runs={finished} initialBase={initialBase} />
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}

export default function ReportsPage() {
  return (
    <React.Suspense fallback={<LoadingRows />}>
      <ReportsContent />
    </React.Suspense>
  );
}
