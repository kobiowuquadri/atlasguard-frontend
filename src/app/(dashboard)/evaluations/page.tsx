'use client';

import { FlaskConical, Play } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { FilterSelect, Pagination } from '@/components/app/filters';
import { EmptyState, ErrorState, LoadingRows, PageHeader } from '@/components/app/page';
import { RunsTable } from '@/components/app/runs-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useProjects, useRuns } from '@/lib/api/hooks';

const STATUS_OPTIONS = [
  { value: 'QUEUED', label: 'Queued' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function EvaluationsPage() {
  const [projectId, setProjectId] = React.useState<string>();
  const [status, setStatus] = React.useState<string>();
  const [page, setPage] = React.useState(1);
  const projects = useProjects();
  const runs = useRuns({ projectId, status, page }, { live: true });

  React.useEffect(() => setPage(1), [projectId, status]);

  return (
    <>
      <PageHeader
        title="Evaluations"
        description="Every run records the benchmark version, model identity, generation parameters and each actual response."
        actions={
          <Button asChild>
            <Link href="/evaluations/new">
              <Play /> New evaluation
            </Link>
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <FilterSelect
          label="Project"
          value={projectId}
          onChange={setProjectId}
          options={(projects.data?.items ?? []).map((p) => ({ value: p.id, label: p.name }))}
          className="w-56"
        />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
      </div>
      {runs.isLoading && <LoadingRows />}
      {runs.error && <ErrorState error={runs.error} onRetry={() => void runs.refetch()} />}
      {runs.data && runs.data.items.length === 0 && (
        <EmptyState
          icon={FlaskConical}
          title="No evaluation runs yet"
          description="Start an evaluation to execute benchmark cases against N-ATLaS and inspect every response."
          action={
            <Button asChild>
              <Link href="/evaluations/new">
                <Play /> New evaluation
              </Link>
            </Button>
          }
        />
      )}
      {runs.data && runs.data.items.length > 0 && (
        <Card>
          <CardContent className="pt-2">
            <RunsTable runs={runs.data.items} />
          </CardContent>
        </Card>
      )}
      <Pagination meta={runs.data?.meta} onPage={setPage} />
    </>
  );
}
