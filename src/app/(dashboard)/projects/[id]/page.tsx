'use client';

import { Archive, ArrowRight, CalendarDays, FlaskConical, Pencil, Play } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import * as React from 'react';
import { Breadcrumbs } from '@/components/app/app-shell';
import { ProjectMonogram } from '@/components/app/monogram';
import { EmptyState, ErrorState, LoadingRows, MetaItem, PageHeader } from '@/components/app/page';
import { ArchiveProjectDialog, EditProjectDialog } from '@/components/app/project-dialogs';
import { RunList } from '@/components/app/run-list';
import { LanguageChip, SimulatedBadge } from '@/components/app/status';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBenchmarks, useProject } from '@/lib/api/hooks';
import { formatDate, formatMs, formatPercent } from '@/lib/utils';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const project = useProject(id);
  const suites = useBenchmarks();
  const [editing, setEditing] = React.useState(false);
  const [archiving, setArchiving] = React.useState(false);

  if (project.isLoading) return <LoadingRows rows={5} />;
  if (project.error || !project.data) return <ErrorState error={project.error} onRetry={() => void project.refetch()} />;
  const p = project.data;
  const last = p.evaluationSummary.lastCompletedRun;

  const metrics: Array<{ label: string; value: React.ReactNode; hint?: React.ReactNode }> = [
    { label: 'Evaluation runs', value: p.evaluationSummary.totalRuns },
    { label: 'Completed runs', value: p.evaluationSummary.runsByStatus.COMPLETED ?? 0 },
    {
      label: 'Last pass rate',
      value: formatPercent(last?.summary?.overall.verifiedPassRate ?? null),
      hint: last ? (
        <span className="inline-flex items-center gap-1.5">
          {last.suite.name} v{last.suite.version}
          {last.isSimulated && <SimulatedBadge />}
        </span>
      ) : (
        'No completed runs'
      ),
    },
    { label: 'Last avg latency', value: formatMs(last?.summary?.overall.averageLatencyMs ?? null), hint: 'Round trip per case' },
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: 'Projects', href: '/projects' }, { label: p.name }]} />
      <PageHeader
        eyebrow="Project"
        title={
          <span className="flex items-center gap-3">
            <ProjectMonogram name={p.name} className="size-10 text-base" />
            {p.name}
          </span>
        }
        description={p.description || undefined}
        meta={<MetaItem icon={CalendarDays}>Created {formatDate(p.createdAt)}</MetaItem>}
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil /> Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setArchiving(true)}>
              <Archive /> Archive
            </Button>
            <Button asChild>
              <Link href={`/evaluations/new?projectId=${p.id}`}>
                <Play /> Run evaluation
              </Link>
            </Button>
          </>
        }
      />
      <EditProjectDialog project={p} open={editing} onOpenChange={setEditing} />
      <ArchiveProjectDialog project={p} open={archiving} onOpenChange={setArchiving} />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border shadow-card lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="flex flex-col gap-1.5 bg-card px-5 py-4">
            <span className="eyebrow">{m.label}</span>
            <span className="text-2xl leading-none font-semibold tracking-tight">{m.value}</span>
            {m.hint && <span className="text-[11px] text-subtle-foreground">{m.hint}</span>}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent runs</CardTitle>
            <CardDescription>The latest evaluations in this project</CardDescription>
          </CardHeader>
          <CardContent className={p.recentRuns.length ? 'px-2 pb-2' : undefined}>
            {p.recentRuns.length === 0 ? (
              <EmptyState
                icon={FlaskConical}
                title="No runs in this project yet"
                description="Run a benchmark suite to see per-language results here."
                action={
                  <Button asChild size="sm">
                    <Link href={`/evaluations/new?projectId=${p.id}`}>
                      <Play /> Run evaluation
                    </Link>
                  </Button>
                }
              />
            ) : (
              <RunList runs={p.recentRuns} showProject={false} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Evaluation suites</CardTitle>
            <CardDescription>Benchmarks available to this project</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {suites.data?.items.length === 0 && <p className="text-sm text-muted-foreground">No benchmark suites available.</p>}
            {suites.data?.items.map((s) => (
              <div key={s.id} className="rounded-xl border border-border bg-inset p-4">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/benchmarks/${s.id}`} className="truncate text-sm font-medium hover:underline">
                    {s.name}
                  </Link>
                  <span className="shrink-0 font-mono text-[11px] text-subtle-foreground">v{s.version}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {Object.entries(s.stats.languages).map(([code, n]) => (
                    <LanguageChip key={code} code={code} count={n} compact />
                  ))}
                </div>
                <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
                  <Link href={`/evaluations/new?projectId=${p.id}&suiteId=${s.id}`}>
                    Evaluate with this suite <ArrowRight />
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
