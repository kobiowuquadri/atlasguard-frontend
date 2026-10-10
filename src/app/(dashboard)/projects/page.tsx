'use client';

import { ArrowUpRight, FolderKanban, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { EmptyState, ErrorState, LoadingRows, PageHeader } from '@/components/app/page';
import { ProjectMonogram } from '@/components/app/monogram';
import { CreateProjectDialog } from '@/components/app/project-dialogs';
import { bucketCounts } from '@/components/app/run-list';
import { RunStatusBadge, SimulatedBadge } from '@/components/app/status';
import { VerdictBar } from '@/components/app/viz';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form-controls';
import { useProjects } from '@/lib/api/hooks';
import { formatDate, formatPercent, formatRelative } from '@/lib/utils';

function ProjectsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = React.useState('');
  const [open, setOpen] = React.useState(params.get('create') === '1');
  const projects = useProjects({ search: search || undefined });

  React.useEffect(() => {
    if (params.get('create') === '1') setOpen(true);
  }, [params]);

  const setDialog = (value: boolean) => {
    setOpen(value);
    if (!value && params.get('create')) router.replace('/projects');
  };

  return (
    <>
      <PageHeader
        title="Projects"
        description="Each project represents an AI application you evaluate with N-ATLaS."
        actions={
          <Button onClick={() => setDialog(true)}>
            <Plus /> New project
          </Button>
        }
      />
      <CreateProjectDialog open={open} onOpenChange={setDialog} />

      <div className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute top-3 left-3 size-4 text-subtle-foreground" aria-hidden />
        <Input placeholder="Search projects" aria-label="Search projects" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {projects.isLoading && <LoadingRows />}
      {projects.error && <ErrorState error={projects.error} onRetry={() => void projects.refetch()} />}
      {projects.data && projects.data.items.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title={search ? 'No projects match your search' : 'No projects yet'}
          description="Create a project for the application you want to evaluate, then run benchmark suites against N-ATLaS."
          action={
            !search && (
              <Button onClick={() => setDialog(true)}>
                <Plus /> Create your first project
              </Button>
            )
          }
        />
      )}
      {projects.data && projects.data.items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.data.items.map((p) => {
            const run = p.latestRun;
            const overall = run?.summary?.overall;
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="group surface flex flex-col rounded-xl border border-border p-5 transition-[border-color,transform] hover:-translate-y-px hover:border-white/15"
              >
                <div className="flex items-start gap-3">
                  <ProjectMonogram name={p.name} />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-[15px] font-semibold tracking-tight">{p.name}</h2>
                    <p className="text-xs text-subtle-foreground">Created {formatDate(p.createdAt)}</p>
                  </div>
                  <ArrowUpRight className="size-4 text-subtle-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" aria-hidden />
                </div>
                <p className="mt-3 line-clamp-2 min-h-10 text-[13px] leading-relaxed text-muted-foreground">{p.description || 'No description'}</p>
                <div className="mt-auto border-t border-border pt-4">
                  {run ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="eyebrow">Latest run</span>
                        <span className="flex items-center gap-1.5">
                          {run.isSimulated && <SimulatedBadge />}
                          <RunStatusBadge status={run.status} />
                        </span>
                      </div>
                      <VerdictBar counts={bucketCounts(overall)} pending={overall?.pending ?? 0} legend="none" size="sm" className="mt-3" />
                      <div className="mt-2.5 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {overall?.verifiedPassRate != null ? (
                            <>
                              <span className="font-semibold text-foreground">{formatPercent(overall.verifiedPassRate)}</span> pass rate
                            </>
                          ) : (
                            'No decided cases'
                          )}
                        </span>
                        <span className="text-subtle-foreground">
                          {p.runCount} run{p.runCount === 1 ? '' : 's'} · {formatRelative(run.createdAt)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-subtle-foreground">No evaluation runs yet</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function ProjectsPage() {
  return (
    <React.Suspense fallback={<LoadingRows />}>
      <ProjectsContent />
    </React.Suspense>
  );
}
