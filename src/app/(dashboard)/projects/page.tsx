'use client';

import { FolderKanban, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { EmptyState, ErrorState, LoadingRows, PageHeader } from '@/components/app/page';
import { CreateProjectDialog } from '@/components/app/project-dialogs';
import { RunStatusBadge, SimulatedBadge } from '@/components/app/status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/form-controls';
import { useProjects } from '@/lib/api/hooks';
import { formatDate, formatPercent, formatRelative } from '@/lib/utils';

function ProjectsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [search, setSearch] = React.useState('');
  const [open, setOpen] = React.useState(params.get('create') === '1');
  const projects = useProjects({ search: search || undefined });

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

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-subtle-foreground" aria-hidden />
        <Input
          placeholder="Search projects"
          aria-label="Search projects"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {projects.isLoading && <LoadingRows />}
      {projects.error && <ErrorState error={projects.error} onRetry={() => void projects.refetch()} />}
      {projects.data && projects.data.items.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title={search ? 'No projects match your search' : 'No projects yet'}
          description="Create a project for the application you want to evaluate, then run benchmark suites against N-ATLaS."
          action={
            <Button onClick={() => setDialog(true)}>
              <Plus /> Create your first project
            </Button>
          }
        />
      )}
      {projects.data && projects.data.items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.data.items.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="group">
              <Card className="flex h-full flex-col p-5 transition-colors group-hover:border-border-strong group-hover:bg-card-hover">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-semibold">{p.name}</h2>
                  <span className="text-xs text-subtle-foreground">{formatDate(p.createdAt)}</span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{p.description || 'No description'}</p>
                <div className="mt-auto pt-4">
                  {p.latestRun ? (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <RunStatusBadge status={p.latestRun.status} />
                      {p.latestRun.isSimulated && <SimulatedBadge />}
                      <span>
                        {p.latestRun.summary?.overall.verifiedPassRate != null
                          ? `${formatPercent(p.latestRun.summary.overall.verifiedPassRate)} pass rate`
                          : 'No decided cases'}
                      </span>
                      <span className="text-subtle-foreground">· {formatRelative(p.latestRun.createdAt)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-subtle-foreground">No evaluation runs yet</span>
                  )}
                  <div className="mt-2 text-xs text-subtle-foreground">
                    {p.runCount} run{p.runCount === 1 ? '' : 's'}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
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
