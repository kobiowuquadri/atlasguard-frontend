'use client';

import {
  Activity,
  BookOpen,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Cpu,
  FlaskConical,
  FolderKanban,
  Gauge,
  Play,
  Timer,
  X,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { ActivityChart, LanguageRateBars, VerdictBreakdown } from '@/components/app/charts';
import { EmptyState, ErrorState, LoadingRows, PageHeader, SectionTitle, StatTile } from '@/components/app/page';
import { RunsTable } from '@/components/app/runs-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label, Switch } from '@/components/ui/form-controls';
import { useCompleteOnboarding, useMe, useOverview } from '@/lib/api/hooks';
import type { Overview } from '@/lib/api/types';
import { formatMs, formatNumber, formatPercent } from '@/lib/utils';

function Onboarding({ overview, name }: { overview: Overview; name: string }) {
  const complete = useCompleteOnboarding();
  const natlas = overview.model.status;
  const steps = [
    {
      done: overview.projectCount > 0,
      title: 'Create a project',
      body: 'A project represents the AI application you want to evaluate.',
      href: '/projects?create=1',
      cta: 'Create project',
    },
    {
      done: false,
      title: 'Browse the benchmarks',
      body: 'Inspect the Nigerian Context Benchmark: prompts, reference facts and review status.',
      href: '/benchmarks',
      cta: 'View benchmarks',
    },
    {
      done: natlas === 'available',
      title: natlas === 'available' ? 'N-ATLaS is connected' : 'Connect N-ATLaS',
      body:
        natlas === 'available'
          ? 'The inference endpoint is reachable. Evaluations will use the real model.'
          : 'No live N-ATLaS endpoint yet. An administrator configures it on the server (see docs/natlas-integration.md).',
      href: '/settings#model',
      cta: 'Model status',
    },
    {
      done: overview.totals.runs > 0,
      title: 'Run your first evaluation',
      body: 'Pick a suite and languages; AtlasGuard records every response and check.',
      href: '/evaluations/new',
      cta: 'New evaluation',
    },
  ];
  return (
    <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary-soft/60 to-card">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">Welcome to AtlasGuard, {name.split(' ')[0]}</CardTitle>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            AtlasGuard tests how reliably N-ATLaS answers across Yoruba, Hausa, Igbo and Nigerian English — and whether the
            facts stay the same from one language to another.
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={() => complete.mutate()} aria-label="Dismiss onboarding">
          <X />
        </Button>
      </CardHeader>
      <CardContent>
        <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                {s.done ? <CircleCheck className="size-4 text-success" aria-label="Done" /> : <CircleDashed className="size-4 text-muted-foreground" aria-label="To do" />}
                {i + 1}. {s.title}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{s.body}</p>
              <Button asChild variant="secondary" size="sm" className="mt-auto self-start">
                <Link href={s.href}>{s.cta}</Link>
              </Button>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export default function OverviewPage() {
  const [includeSimulated, setIncludeSimulated] = React.useState(false);
  const me = useMe();
  const overview = useOverview(includeSimulated);
  const data = overview.data;

  return (
    <>
      <PageHeader
        title="Overview"
        description="Reliability of N-ATLaS across your projects, computed from stored evaluation records."
        actions={
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5">
            <Switch id="include-simulated" checked={includeSimulated} onCheckedChange={setIncludeSimulated} />
            <Label htmlFor="include-simulated" className="text-xs text-muted-foreground">
              Include simulated runs
            </Label>
          </div>
        }
      />

      {overview.isLoading && <LoadingRows rows={5} />}
      {overview.error && <ErrorState error={overview.error} onRetry={() => void overview.refetch()} />}

      {data && (
        <div className={overview.isFetching && overview.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
          {me.data && !me.data.user.onboardedAt && <Onboarding overview={data} name={me.data.user.name} />}

          {includeSimulated && data.simulatedRunCount > 0 && (
            <p className="mb-4 rounded-md border border-warning/30 bg-warning-soft px-3 py-2 text-xs text-amber-200">
              These figures include {data.simulatedRunCount} simulated (fixture) run{data.simulatedRunCount === 1 ? '' : 's'}. Simulated responses are not N-ATLaS output.
            </p>
          )}
          {!includeSimulated && data.totals.runs === 0 && data.simulatedRunCount > 0 && (
            <p className="mb-4 rounded-md border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
              No real N-ATLaS runs yet. {data.simulatedRunCount} simulated run{data.simulatedRunCount === 1 ? ' is' : 's are'} hidden — turn on “Include simulated runs” to see them.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatTile label="Evaluation runs" value={formatNumber(data.totals.runs)} icon={FlaskConical} />
            <StatTile label="Cases evaluated" value={formatNumber(data.totals.casesEvaluated)} icon={Activity} />
            <StatTile
              label="Verified pass rate"
              value={formatPercent(data.totals.verifiedPassRate)}
              hint={data.totals.determinate ? `of ${formatNumber(data.totals.determinate)} decided cases` : 'No decided cases yet'}
              icon={Gauge}
            />
            <StatTile label="Avg response latency" value={formatMs(data.totals.averageLatencyMs)} hint="Round trip" icon={Timer} />
            <StatTile
              label="Needs review"
              value={formatNumber(data.totals.needsReview)}
              tone={data.totals.needsReview ? 'warning' : 'default'}
              icon={CircleAlert}
            />
            <StatTile
              label="N-ATLaS"
              value={
                <span className="text-base">
                  {data.model.status === 'available' ? 'Connected' : data.model.status === 'not_configured' ? 'Not configured' : 'Unavailable'}
                </span>
              }
              hint={data.model.status === 'available' ? 'Live endpoint' : 'See Settings'}
              tone={data.model.status === 'available' ? 'success' : 'danger'}
              icon={Cpu}
            />
          </div>

          {data.totals.runs === 0 ? (
            <EmptyState
              className="mt-6"
              icon={FlaskConical}
              title="No evaluation runs yet"
              description="Create a project, pick the Nigerian Context Benchmark and choose the languages to evaluate. Results appear here as soon as cases complete."
              action={
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild>
                    <Link href="/evaluations/new">
                      <Play /> New evaluation
                    </Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href="/benchmarks">
                      <BookOpen /> Browse benchmarks
                    </Link>
                  </Button>
                </div>
              }
            />
          ) : (
            <>
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardContent className="pt-5">
                    <ActivityChart data={data.activity} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Verdict distribution</CardTitle>
                    <p className="text-xs text-muted-foreground">{formatNumber(data.totals.casesEvaluated)} evaluated cases</p>
                  </CardHeader>
                  <CardContent>
                    <VerdictBreakdown counts={data.verdictDistribution} />
                  </CardContent>
                </Card>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Verified pass rate by language</CardTitle>
                    <p className="text-xs text-muted-foreground">PASSED ÷ (PASSED + FAILED); review and errors excluded</p>
                  </CardHeader>
                  <CardContent>
                    <LanguageRateBars
                      rows={data.languageComparison.map((l) => ({
                        key: l.language,
                        label: l.name,
                        rate: l.verifiedPassRate,
                        determinate: l.determinate,
                        evaluated: l.evaluated,
                      }))}
                    />
                    <Link href="/insights" className="mt-4 inline-block text-xs text-violet-300 underline-offset-4 hover:underline">
                      Open language insights →
                    </Link>
                  </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                  <CardContent className="pt-5">
                    <SectionTitle
                      action={
                        <Link href="/evaluations" className="text-xs text-violet-300 underline-offset-4 hover:underline">
                          All runs →
                        </Link>
                      }
                    >
                      Recent evaluation runs
                    </SectionTitle>
                    <RunsTable runs={data.recentRuns} />
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {data.projectCount === 0 && data.totals.runs === 0 && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Tip: start by <Link href="/projects?create=1" className="text-violet-300 hover:underline">creating a project</Link>{' '}
              <FolderKanban className="inline size-3.5" aria-hidden />
            </p>
          )}
        </div>
      )}
    </>
  );
}
