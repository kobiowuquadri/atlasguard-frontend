'use client';

import { ArrowDownRight, CircleCheck, GitCompareArrows } from 'lucide-react';
import * as React from 'react';
import { EmptyState } from '@/components/app/page';
import { ConsistencyBadge, FACT_META, FactStatusBadge, LanguageChip, VerdictBadge } from '@/components/app/status';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Segmented } from '@/components/ui/misc';
import { Tooltip } from '@/components/ui/overlays';
import type { ConsistencyFinding, ConsistencyGroup, FactStatus } from '@/lib/api/types';
import { categoryLabel, LANGUAGES, languageName } from '@/lib/constants';
import { cn } from '@/lib/utils';

const langAttr = (code: string) => (code === 'en-NG' ? 'en' : code);

type Entry = ConsistencyGroup['entries'][number];
type CellState = FactStatus | 'no_response';

const RANK: Record<FactStatus, number> = { supported: 0, uncertain: 1, not_found: 2, contradicted: 3 };
const LANG_ORDER = LANGUAGES.map((l) => l.code as string);

/** Asserted values as written in reports: numbers get thousands separators, conflict markers are dropped. */
function formatValues(values: Array<string | number>): string {
  return values.map((v) => (typeof v === 'number' ? v.toLocaleString('en-NG') : String(v).replace(/^conflict:/, ''))).join(', ');
}

/** A language's cell = the worst status among its own fact checks against the reference. */
function cellFor(group: ConsistencyGroup, entry: Entry): { state: CellState; supported: number; total: number } {
  const total = group.expectedFacts.length;
  if (entry.response === null) return { state: 'no_response', supported: 0, total };
  const checks = entry.factChecks ?? [];
  let state: FactStatus = 'supported';
  for (const c of checks) if (RANK[c.status] > RANK[state]) state = c.status;
  return { state, supported: checks.filter((c) => c.status === 'supported').length, total };
}

const SEVERITY: Record<ConsistencyFinding['severity'], { state: CellState; label: string }> = {
  conflict: { state: 'contradicted', label: 'Confirmed conflict' },
  omission: { state: 'not_found', label: 'Omission' },
  review: { state: 'uncertain', label: 'Needs review' },
  info: { state: 'no_response', label: 'Info' },
};

function StateGlyph({ state, className }: { state: CellState; className?: string }) {
  const meta = FACT_META[state];
  const Icon = meta.icon;
  return <Icon className={cn('size-4 shrink-0', meta.text, className)} aria-hidden />;
}

/* --------------------------------------------------------------- Matrix */

function MatrixLegend() {
  const items: CellState[] = ['supported', 'uncertain', 'not_found', 'contradicted', 'no_response'];
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {items.map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <StateGlyph state={s} className="size-3.5" /> {FACT_META[s].label}
        </li>
      ))}
    </ul>
  );
}

export function ConsistencyMatrix({ groups }: { groups: ConsistencyGroup[] }) {
  const present = new Set(groups.flatMap((g) => [...g.languagesCompared, ...g.languagesMissing, ...g.entries.map((e) => e.language)]));
  const languages = LANGUAGES.filter((l) => present.has(l.code));
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight">Consistency map</h3>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Each cell is that language’s worst fact status against the reference.</p>
        </div>
        <MatrixLegend />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse text-sm">
          <thead>
            <tr className="text-left">
              <th scope="col" className="px-5 py-2.5">
                <span className="eyebrow">Semantic group</span>
              </th>
              {languages.map((l) => (
                <th key={l.code} scope="col" className="px-2 py-2.5 font-normal">
                  <LanguageChip code={l.code} />
                </th>
              ))}
              <th scope="col" className="px-5 py-2.5 text-right">
                <span className="eyebrow">Verdict</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.id} className="group border-t border-border transition-colors hover:bg-white/[0.02]">
                <th scope="row" className="max-w-[18rem] px-5 py-3 text-left font-normal">
                  <a href={`#cg-${g.id}`} className="block rounded-sm hover:underline hover:underline-offset-4">
                    <span className="block truncate font-medium text-foreground">{g.title}</span>
                    <span className="block truncate font-mono text-[11px] text-subtle-foreground">{g.semanticGroupKey}</span>
                  </a>
                </th>
                {languages.map((l) => {
                  const entry = g.entries.find((e) => e.language === l.code);
                  if (!entry) {
                    return (
                      <td key={l.code} className="px-2 py-3">
                        <span className="text-xs text-subtle-foreground">{g.languagesMissing.includes(l.code) ? 'Missing' : '—'}</span>
                      </td>
                    );
                  }
                  const cell = cellFor(g, entry);
                  return (
                    <td key={l.code} className="px-2 py-3">
                      <Tooltip
                        content={
                          <span className="flex flex-col gap-1">
                            <span className="font-medium">
                              {l.name} · {FACT_META[cell.state].label}
                            </span>
                            {g.expectedFacts.map((fact) => {
                              const check = entry.factChecks?.find((c) => c.factId === fact.id);
                              return (
                                <span key={fact.id} className="flex items-start gap-1.5 text-muted-foreground">
                                  <StateGlyph state={check?.status ?? 'no_response'} className="mt-px size-3.5" />
                                  <span>
                                    {fact.description}
                                    {check?.assertedValues?.length ? <span className="font-mono"> — stated {formatValues(check.assertedValues)}</span> : null}
                                  </span>
                                </span>
                              );
                            })}
                          </span>
                        }
                      >
                        <a
                          href={`#cg-${g.id}`}
                          className={cn(
                            'inline-flex h-8 items-center gap-1.5 rounded-md px-2 transition-colors hover:bg-white/[0.05]',
                            cell.state === 'contradicted' && 'bg-danger-soft inset-ring inset-ring-red-400/25',
                          )}
                          aria-label={`${l.name}: ${FACT_META[cell.state].label}, ${cell.supported} of ${cell.total} facts supported`}
                        >
                          <StateGlyph state={cell.state} />
                          <span className="font-mono text-[11px] text-muted-foreground tabular">
                            {cell.supported}/{cell.total}
                          </span>
                        </a>
                      </Tooltip>
                    </td>
                  );
                })}
                <td className="px-5 py-3 text-right">
                  <ConsistencyBadge verdict={g.verdict} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------- Findings */

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
    <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-inset">
      {relevant.map((f, i) => {
        const meta = SEVERITY[f.severity];
        return (
          <li key={i} className="flex gap-3 px-3.5 py-3">
            <span aria-label={meta.label} className="mt-0.5">
              <StateGlyph state={meta.state} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-slate-200">{f.type}</code>
                <span className="text-[11px] text-subtle-foreground">{meta.label}</span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{f.message}</p>
              {f.values && Object.keys(f.values).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(f.values)
                    .sort(([a], [b]) => LANG_ORDER.indexOf(a) - LANG_ORDER.indexOf(b))
                    .map(([lang, values]) => (
                    <span key={lang} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] py-0.5 pr-2.5 pl-0.5 inset-ring inset-ring-white/10">
                      <LanguageChip code={lang} compact className="bg-transparent inset-ring-0" />
                      <span className="font-mono text-[11.5px] text-foreground">{formatValues(values) || '—'}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------ GroupCard */

function GroupCard({ group }: { group: ConsistencyGroup }) {
  const s = group.summary;
  const facts = group.expectedFacts;
  const stats: Array<[string, number, CellState]> = [
    ['Shared facts checked', s.sharedFactsChecked, 'supported'],
    ['Confirmed contradictions', s.confirmedContradictions, 'contradicted'],
    ['Missing facts', s.missingFacts, 'not_found'],
    ['Uncertain findings', s.uncertainFindings, 'uncertain'],
  ];
  return (
    <Card id={`cg-${group.id}`} className="scroll-mt-24">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold tracking-tight">{group.title}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-subtle-foreground">
            <span className="font-mono">{group.semanticGroupKey}</span>
            <Badge variant="neutral">{categoryLabel(group.category)}</Badge>
          </div>
        </div>
        <ConsistencyBadge verdict={group.verdict} />
      </div>

      <dl className="mx-5 mt-4 grid grid-cols-2 divide-border overflow-hidden rounded-lg border border-border sm:grid-cols-4 sm:divide-x">
        {stats.map(([label, value, state]) => (
          <div key={label} className="px-3.5 py-2.5">
            <dt className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <StateGlyph state={value > 0 || state === 'supported' ? state : 'no_response'} className="size-3.5" />
              {label}
            </dt>
            <dd className="mt-1 text-lg leading-none font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="px-5 pt-4">
        <Findings findings={group.findings} />
      </div>

      <div className="mt-5 overflow-x-auto border-t border-border">
        <div
          className="grid min-w-[44rem] divide-x divide-border"
          style={{ gridTemplateColumns: `repeat(${Math.max(group.entries.length, 1)}, minmax(0, 1fr))` }}
        >
          {group.entries.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <LanguageChip code={entry.language} />
                <VerdictBadge verdict={entry.finalVerdict} />
              </div>
              <details className="group/details text-xs text-muted-foreground">
                <summary className="cursor-pointer list-none select-none hover:text-foreground">
                  <span className="inline-flex items-center gap-1">
                    <ArrowDownRight className="size-3 transition-transform group-open/details:rotate-90" aria-hidden /> Prompt
                  </span>
                </summary>
                <p lang={langAttr(entry.language)} className="mt-1.5 leading-relaxed whitespace-pre-wrap">
                  {entry.prompt}
                </p>
              </details>
              <div>
                <div className="eyebrow mb-1.5">Response</div>
                {entry.response !== null ? (
                  <p lang={langAttr(entry.language)} className="max-h-48 overflow-y-auto text-[13px] leading-relaxed whitespace-pre-wrap text-slate-200">
                    {entry.response}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No response{entry.errorDetails ? ` — ${entry.errorDetails.code}` : ''}</p>
                )}
              </div>
              <div className="mt-auto border-t border-border pt-3">
                <div className="eyebrow mb-2">Expected fact checks</div>
                <ul className="flex flex-col gap-2">
                  {facts.map((fact) => {
                    const check = entry.factChecks?.find((f) => f.factId === fact.id);
                    return (
                      <li key={fact.id} className="text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-muted-foreground">{fact.description}</span>
                          <FactStatusBadge status={check ? check.status : 'no_response'} />
                        </div>
                        {check?.assertedValues && check.assertedValues.length > 0 && (
                          <div className="mt-1 font-mono text-[11px] text-subtle-foreground">
                            stated: {formatValues(check.assertedValues)}
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
        <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          Missing responses: {group.languagesMissing.map(languageName).join(', ')}
        </p>
      )}
    </Card>
  );
}

/* ----------------------------------------------------------------- View */

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
  const issues = groups.filter((g) => g.verdict !== 'CONSISTENT');
  const shown = filter === 'issues' ? issues : groups;
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-5">
        {(
          [
            ['Groups compared', groups.length],
            ['Inconsistent', totals.inconsistent],
            ['Contradictions', totals.contradictions],
            ['Missing facts', totals.missing],
            ['Uncertain', totals.uncertain],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="bg-card px-4 py-3">
            <div className="eyebrow">{label}</div>
            <div className={cn('mt-1.5 text-xl font-semibold', label === 'Contradictions' && value > 0 && 'text-red-300')}>{value}</div>
          </div>
        ))}
      </div>

      <ConsistencyMatrix groups={groups} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
          A confirmed contradiction means two languages stated different values for the same numeric or named-entity fact. A missing
          fact is an omission, not a contradiction. Lexical (concept) differences are routed to human review.
        </p>
        <Segmented
          label="Filter groups"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All groups', count: groups.length },
            { value: 'issues', label: 'Only issues', count: issues.length },
          ]}
        />
      </div>
      {shown.map((g) => (
        <GroupCard key={g.id} group={g} />
      ))}
    </div>
  );
}
