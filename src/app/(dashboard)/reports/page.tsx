'use client';

import { ArrowDownRight, ArrowUpRight, Download, FileCheck2, FileText, Minus } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';
import { EmptyState, ErrorState, LoadingRows, PageHeader, StatTile } from '@/components/app/page';
import { SimulatedBadge, VerdictBadge } from '@/components/app/status';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, Td, Th } from '@/components/ui/misc';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/overlays';
import { api, downloadFile, errorMessage, saveJson } from '@/lib/api/client';
import { useCompare, useReport, useRuns } from '@/lib/api/hooks';
import type { CompareRow, Run } from '@/lib/api/types';
import { languageName } from '@/lib/constants';
import { cn, formatDateTime, formatMs, formatPercent, shortId } from '@/lib/utils';

function runLabel(r: Run) {
  return `${r.suite.name} #${shortId(r.id)} · ${new Date(r.createdAt).toLocaleDateString('en-NG')}${r.isSimulated ? ' · simulated' : ''}`;
}

function RunPicker({ runs, value, onChange, label }: { runs: Run[]; value?: string; onChange: (v: string) => void; label: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="max-w-md">
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

function CompareTable({ rows, title }: { rows: CompareRow[]; title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <thead>
            <tr>
              <Th />
              <Th className="text-right">Base pass rate</Th>
              <Th className="text-right">Target pass rate</Th>
              <Th className="text-right">Change</Th>
              <Th className="text-right">Latency change</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
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

  return (
    <div className="flex flex-col gap-4">
      {r.simulated && (
        <p className="rounded-md border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-amber-100">{r.simulationNotice}</p>
      )}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 font-semibold">
              {r.overview.benchmark.name} v{r.overview.benchmark.version}
              {r.simulated && <SimulatedBadge />}
            </div>
            <div className="text-xs text-muted-foreground">
              {r.overview.project.name} · <span className="font-mono">{r.overview.model.modelIdentifier}</span> · completed{' '}
              {formatDateTime(r.overview.run.completedAt)}
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
        </CardContent>
      </Card>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        <StatTile label="Verified pass rate" value={formatPercent(r.summary.verifiedPassRate)} />
        <StatTile label="Passed / failed" value={`${r.summary.passed} / ${r.summary.failed}`} />
        <StatTile label="Needs review" value={r.summary.needsReview} />
        <StatTile label="Errors / skipped" value={`${r.summary.errors} / ${r.summary.skipped}`} />
        <StatTile label="Avg latency" value={formatMs(r.summary.averageLatencyMs)} />
        <StatTile label="Contradictions" value={r.consistency.confirmedContradictions} hint={`${r.consistency.groupsCompared} groups`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Language performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <thead>
                <tr>
                  <Th>Language</Th>
                  <Th className="text-right">Cases</Th>
                  <Th className="text-right">Pass rate</Th>
                  <Th className="text-right">Avg latency</Th>
                </tr>
              </thead>
              <tbody>
                {r.languagePerformance.map((l) => (
                  <tr key={l.language}>
                    <Td>{l.name}</Td>
                    <Td className="text-right tabular">{l.total}</Td>
                    <Td className="text-right tabular">{formatPercent(l.verifiedPassRate)}</Td>
                    <Td className="text-right tabular">{formatMs(l.averageLatencyMs)}</Td>
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
          <CardContent>
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
                  <tr key={c.category}>
                    <Td>{c.label}</Td>
                    <Td className="text-right tabular">{c.total}</Td>
                    <Td className="text-right tabular">{formatPercent(c.verifiedPassRate)}</Td>
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
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
          {Object.entries(r.methodology).map(([k, v]) => (
            <p key={k}>
              <strong className="text-foreground capitalize">{k.replace(/([A-Z])/g, ' $1')}:</strong> {v}
            </p>
          ))}
          <ul className="list-disc pl-5">
            {r.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Full per-case findings are in the <Link href={`/evaluations/${runId}`} className="text-violet-300 hover:underline">run details</Link> and the exports.
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
      <Card>
        <CardContent className="grid gap-3 pt-5 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Base run</span>
            <RunPicker runs={runs} value={base} onChange={(v) => { setBase(v); setTarget(undefined); }} label="Select base run" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Target run (same benchmark suite)</span>
            <RunPicker runs={compatible} value={target} onChange={setTarget} label={base ? 'Select target run' : 'Select a base run first'} />
          </div>
        </CardContent>
      </Card>
      {compare.isLoading && <LoadingRows />}
      {compare.error && <ErrorState error={compare.error} />}
      {compare.data && (
        <>
          {compare.data.warnings.length > 0 && (
            <ul className="rounded-md border border-warning/30 bg-warning-soft px-4 py-2 text-sm text-amber-100">
              {compare.data.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Base pass rate" value={formatPercent(compare.data.base.overall.verifiedPassRate)} />
            <StatTile label="Target pass rate" value={formatPercent(compare.data.target.overall.verifiedPassRate)} />
            <StatTile label="Change" value={<Delta value={compare.data.overall.passRateDelta} kind="rate" />} />
            <StatTile label="Cases compared" value={compare.data.casesCompared} hint={`${compare.data.caseChanges.length} changed verdict`} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <CompareTable rows={compare.data.byLanguage} title="By language" />
            <CompareTable rows={compare.data.byCategory} title="By category" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Verdict changes</CardTitle>
            </CardHeader>
            <CardContent>
              {compare.data.caseChanges.length === 0 ? (
                <p className="text-sm text-muted-foreground">No case changed its final verdict.</p>
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
                      <tr key={c.caseKey}>
                        <Td className="font-mono text-xs">{c.caseKey}</Td>
                        <Td>{languageName(c.language)}</Td>
                        <Td><VerdictBadge verdict={c.base} /></Td>
                        <Td><VerdictBadge verdict={c.target} /></Td>
                        <Td className="capitalize">{c.direction}</Td>
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
      {runs.data && finished.length === 0 && (
        <EmptyState icon={FileText} title="No finished runs yet" description="Reports appear once an evaluation run has completed." />
      )}
      {finished.length > 0 && (
        <Tabs defaultValue={initialBase ? 'compare' : 'report'}>
          <TabsList>
            <TabsTrigger value="report">Run report</TabsTrigger>
            <TabsTrigger value="compare">Compare runs</TabsTrigger>
          </TabsList>
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
