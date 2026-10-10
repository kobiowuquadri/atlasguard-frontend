'use client';

import Link from 'next/link';
import { RunStatusBadge, SimulatedBadge } from '@/components/app/status';
import { Table, Td, Th } from '@/components/ui/misc';
import type { Run, RunPreview } from '@/lib/api/types';
import { LANGUAGES } from '@/lib/constants';
import { formatPercent, formatRelative, shortId } from '@/lib/utils';

type RunRow = (Run | RunPreview) & { project?: { id: string; name: string } };

function languagesLabel(codes: string[]) {
  return LANGUAGES.filter((l) => codes.includes(l.code))
    .map((l) => l.short)
    .join(' · ');
}

export function RunsTable({ runs, showProject = true }: { runs: RunRow[]; showProject?: boolean }) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Run</Th>
          {showProject && <Th>Project</Th>}
          <Th>Languages</Th>
          <Th>Status</Th>
          <Th className="text-right">Pass rate</Th>
          <Th className="text-right">Cases</Th>
          <Th className="text-right">Created</Th>
        </tr>
      </thead>
      <tbody>
        {runs.map((run) => {
          const overall = run.summary?.overall;
          return (
            <tr key={run.id} className="transition-colors hover:bg-card-hover">
              <Td>
                <Link href={`/evaluations/${run.id}`} className="flex flex-col hover:underline underline-offset-4">
                  <span className="font-medium text-foreground">{run.suite.name}</span>
                  <span className="font-mono text-xs text-subtle-foreground">#{shortId(run.id)}</span>
                </Link>
              </Td>
              {showProject && <Td className="text-muted-foreground">{run.project?.name ?? '—'}</Td>}
              <Td className="text-xs text-muted-foreground">{languagesLabel(run.languages)}</Td>
              <Td>
                <div className="flex flex-wrap items-center gap-1.5">
                  <RunStatusBadge status={run.status} />
                  {run.isSimulated && <SimulatedBadge />}
                </div>
              </Td>
              <Td className="text-right tabular">
                {overall?.verifiedPassRate != null ? formatPercent(overall.verifiedPassRate) : <span className="text-subtle-foreground">—</span>}
              </Td>
              <Td className="text-right tabular text-muted-foreground">
                {run.completedCases}/{run.totalCases}
              </Td>
              <Td className="text-right text-xs whitespace-nowrap text-muted-foreground">{formatRelative(run.createdAt)}</Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
