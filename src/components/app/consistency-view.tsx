'use client';

import { CircleAlert, CircleCheck, CircleMinus, CircleX, GitCompareArrows, Info } from 'lucide-react';
import * as React from 'react';
import { EmptyState } from '@/components/app/page';
import { ConsistencyBadge, FactStatusBadge, VerdictBadge } from '@/components/app/status';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { ConsistencyFinding, ConsistencyGroup } from '@/lib/api/types';
import { categoryLabel } from '@/lib/constants';
import { cn } from '@/lib/utils';

const SEVERITY_ICON: Record<ConsistencyFinding['severity'], { icon: typeof CircleX; className: string; label: string }> = {
  conflict: { icon: CircleX, className: 'text-danger', label: 'Confirmed conflict' },
  omission: { icon: CircleMinus, className: 'text-warning', label: 'Omission' },
  review: { icon: CircleAlert, className: 'text-warning', label: 'Needs review' },
  info: { icon: Info, className: 'text-slate-400', label: 'Info' },
};

const langAttr = (code: string) => (code === 'en-NG' ? 'en' : code);

function Findings({ findings }: { findings: ConsistencyFinding[] }) {
  const relevant = findings.filter((f) => f.type !== 'consistent_fact');
  if (relevant.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-green-300">
        <CircleCheck className="size-4" /> Every shared fact was supported consistently.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {relevant.map((f, i) => {
        const meta = SEVERITY_ICON[f.severity];
        const Icon = meta.icon;
        return (
          <li key={i} className="flex gap-2 text-sm">
            <Icon className={cn('mt-0.5 size-4 shrink-0', meta.className)} aria-label={meta.label} />
            <span>
              <span className="font-mono text-xs text-subtle-foreground">{f.type}</span> — {f.message}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function GroupCard({ group }: { group: ConsistencyGroup }) {
  const s = group.summary;
  const facts = group.expectedFacts;
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">{group.title}</h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-subtle-foreground">
              <span className="font-mono">{group.semanticGroupKey}</span>
              <Badge variant="neutral">{categoryLabel(group.category)}</Badge>
            </div>
          </div>
          <ConsistencyBadge verdict={group.verdict} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Shared facts checked', s.sharedFactsChecked],
            ['Confirmed contradictions', s.confirmedContradictions],
            ['Missing facts', s.missingFacts],
            ['Uncertain findings', s.uncertainFindings],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-md border border-border bg-background-subtle px-3 py-2">
              <dt className="text-[11px] text-muted-foreground">{label}</dt>
              <dd className="text-lg font-semibold tabular">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4">
          <Findings findings={group.findings} />
        </div>

        <div className="mt-5 overflow-x-auto">
          <div className="grid min-w-[44rem] gap-3" style={{ gridTemplateColumns: `repeat(${Math.max(group.entries.length, 1)}, minmax(0, 1fr))` }}>
            {group.entries.map((entry) => (
              <div key={entry.id} className="flex flex-col gap-2 rounded-md border border-border bg-background-subtle p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{entry.languageName}</span>
                  <VerdictBadge verdict={entry.finalVerdict} />
                </div>
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer select-none">Prompt</summary>
                  <p lang={langAttr(entry.language)} className="mt-1 whitespace-pre-wrap">
                    {entry.prompt}
                  </p>
                </details>
                <div>
                  <div className="mb-1 text-[11px] text-subtle-foreground">Response</div>
                  {entry.response !== null ? (
                    <p lang={langAttr(entry.language)} className="max-h-48 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap">
                      {entry.response}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No response{entry.errorDetails ? ` — ${entry.errorDetails.code}` : ''}
                    </p>
                  )}
                </div>
                <div className="mt-auto border-t border-border pt-2">
                  <div className="mb-1 text-[11px] text-subtle-foreground">Expected fact checks</div>
                  <ul className="flex flex-col gap-1.5">
                    {facts.map((fact) => {
                      const check = entry.factChecks?.find((f) => f.factId === fact.id);
                      return (
                        <li key={fact.id} className="text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-muted-foreground">{fact.description}</span>
                            {check ? <FactStatusBadge status={check.status} /> : <FactStatusBadge status="no_response" />}
                          </div>
                          {check?.assertedValues && check.assertedValues.length > 0 && (
                            <div className="mt-0.5 font-mono text-[11px] text-subtle-foreground">
                              stated: {check.assertedValues.map((v) => String(v).replace(/^conflict:/, '')).join(', ')}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
        {group.languagesMissing.length > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">Missing responses: {group.languagesMissing.join(', ')}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function ConsistencyView({ groups }: { groups: ConsistencyGroup[] }) {
  const [filter, setFilter] = React.useState<'all' | 'issues'>('all');
  if (groups.length === 0) {
    return (
      <EmptyState
        icon={GitCompareArrows}
        title="No cross-language analysis for this run"
        description="Consistency is analysed when a run includes at least two languages of the same semantic group and the run has completed."
      />
    );
  }
  const totals = groups.reduce(
    (acc, g) => ({
      contradictions: acc.contradictions + g.summary.confirmedContradictions,
      missing: acc.missing + g.summary.missingFacts,
      uncertain: acc.uncertain + g.summary.uncertainFindings,
      inconsistent: acc.inconsistent + (g.verdict === 'INCONSISTENT' ? 1 : 0),
    }),
    { contradictions: 0, missing: 0, uncertain: 0, inconsistent: 0 },
  );
  const shown = filter === 'issues' ? groups.filter((g) => g.verdict !== 'CONSISTENT') : groups;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm">
        <p className="text-muted-foreground">
          <strong className="text-foreground">{groups.length}</strong> semantic groups compared ·{' '}
          <strong className="text-foreground">{totals.inconsistent}</strong> inconsistent ·{' '}
          <strong className="text-foreground">{totals.contradictions}</strong> confirmed contradictions ·{' '}
          <strong className="text-foreground">{totals.missing}</strong> missing facts ·{' '}
          <strong className="text-foreground">{totals.uncertain}</strong> uncertain findings
        </p>
        <div className="flex gap-1 rounded-md border border-border p-0.5" role="group" aria-label="Filter groups">
          {(['all', 'issues'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                'cursor-pointer rounded px-2.5 py-1 text-xs',
                filter === f ? 'bg-elevated text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {f === 'all' ? 'All groups' : 'Only issues'}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        A confirmed contradiction means two languages stated different values for the same numeric or named-entity fact. A missing
        fact is an omission, not a contradiction. Lexical (concept) differences are routed to human review.
      </p>
      {shown.map((g) => (
        <GroupCard key={g.id} group={g} />
      ))}
    </div>
  );
}
