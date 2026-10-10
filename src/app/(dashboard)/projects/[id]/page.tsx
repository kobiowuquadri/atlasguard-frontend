'use client';

import { Archive, BookOpen, FlaskConical, Pencil, Play } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import * as React from 'react';
import { EmptyState, ErrorState, LoadingRows, PageHeader, SectionTitle, StatTile } from '@/components/app/page';
import { ArchiveProjectDialog, EditProjectDialog } from '@/components/app/project-dialogs';
import { RunsTable } from '@/components/app/runs-table';
import { LanguageBadge } from '@/components/app/status';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/projects" className="hover:text-foreground">
            Projects
          </Link>
        }
        title={p.name}
        description={p.description || `Created ${formatDate(p.createdAt)}`}
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Evaluation runs" value={p.evaluationSummary.totalRuns} />
        <StatTile label="Completed runs" value={p.evaluationSummary.runsByStatus.COMPLETED ?? 0} />
        <StatTile
          label="Last completed pass rate"
          value={formatPercent(last?.summary?.overall.verifiedPassRate ?? null)}
          hint={last ? `${last.suite.name} v${last.suite.version}${last.isSimulated ? ' · simulated' : ''}` : 'No completed runs'}
        />
        <StatTile label="Last avg latency" value={formatMs(last?.summary?.overall.averageLatencyMs ?? null)} hint="Round trip" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-5">
            <SectionTitle>Recent runs</SectionTitle>
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
              <RunsTable runs={p.recentRuns} showProject={false} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Available evaluation suites</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {suites.data?.items.length === 0 && <p className="text-sm text-muted-foreground">No benchmark suites available.</p>}
            {suites.data?.items.map((s) => (
              <div key={s.id} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/benchmarks/${s.id}`} className="text-sm font-medium hover:underline">
                    {s.name}
                  </Link>
                  <span className="text-xs text-subtle-foreground">v{s.version}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(s.stats.languages).map(([code, n]) => (
                    <LanguageBadge key={code} code={code} count={n} />
                  ))}
                </div>
                <Button asChild variant="secondary" size="sm" className="mt-3">
                  <Link href={`/evaluations/new?projectId=${p.id}&suiteId=${s.id}`}>
                    <BookOpen /> Evaluate with this suite
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
