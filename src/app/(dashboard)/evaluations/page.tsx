'use client';

import { FlaskConical, Play } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { FilterSelect, Pagination } from '@/components/app/filters';
import { EmptyState, ErrorState, LoadingRows, PageHeader } from '@/components/app/page';
import { RunList } from '@/components/app/run-list';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Segmented } from '@/components/ui/misc';
import { useProjects, useRuns } from '@/lib/api/hooks';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'QUEUED', label: 'Queued' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function EvaluationsPage() {
  const [projectId, setProjectId] = React.useState<string>();
  const [status, setStatus] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const projects = useProjects();
  const runs = useRuns({ projectId, status: status === 'all' ? undefined : status, page }, { live: true });

  React.useEffect(() => setPage(1), [projectId, status]);
  const filtered = !!projectId || status !== 'all';

  return (
    <>
      <PageHeader
        title="Evaluations"
        description="Every run records the benchmark version, model identity, generation parameters and each actual response."
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Filter by status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        <FilterSelect
          label="Project"
          value={projectId}
          onChange={setProjectId}
          options={(projects.data?.items ?? []).map((p) => ({ value: p.id, label: p.name }))}
          className="w-60"
        />
      </div>
      {runs.isLoading && <LoadingRows />}
      {runs.error && <ErrorState error={runs.error} onRetry={() => void runs.refetch()} />}
      {runs.data && runs.data.items.length === 0 && (
        <EmptyState
          icon={FlaskConical}
          title={filtered ? 'No runs match these filters' : 'No evaluation runs yet'}
          description={
            filtered
              ? 'Try another status or project.'
              : 'Start an evaluation to execute benchmark cases against N-ATLaS and inspect every response.'
          }
          action={
            !filtered && (
              <Button asChild>
                <Link href="/evaluations/new">
                  <Play /> New evaluation
                </Link>
              </Button>
            )
          }
        />
      )}
      {runs.data && runs.data.items.length > 0 && (
        <Card className="p-2">
          <div className="hidden grid-cols-[minmax(0,1fr)_9rem_7rem_4.5rem_1rem] gap-x-5 border-b border-border px-3 pt-1.5 pb-2.5 md:grid">
            <span className="eyebrow">Run</span>
            <span className="eyebrow">Languages</span>
            <span className="eyebrow">Verdicts</span>
            <span className="eyebrow text-right">Pass rate</span>
            <span />
          </div>
          <RunList runs={runs.data.items} />
        </Card>
      )}
      <Pagination meta={runs.data?.meta} onPage={setPage} />
    </>
  );
}
