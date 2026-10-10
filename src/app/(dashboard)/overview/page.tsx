'use client';

import { ArrowRight, BookOpen, CircleCheck, Cpu, FlaskConical, FolderPlus, Play, X } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { ActivityChart, LanguageRateBars } from '@/components/app/charts';
import { EmptyState, ErrorState, PageHeader } from '@/components/app/page';
import { ContourField } from '@/components/app/patterns';
import { RunList } from '@/components/app/run-list';
import { VerdictBar, Sparkline } from '@/components/app/viz';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label, Switch } from '@/components/ui/form-controls';
import { Skeleton } from '@/components/ui/misc';
import { useCompleteOnboarding, useMe, useOverview } from '@/lib/api/hooks';
import type { Overview } from '@/lib/api/types';
import { cn, formatMs, formatNumber, formatPercent } from '@/lib/utils';

function greeting(now = new Date()) {
  const h = now.getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/* ---------------------------------------------------------- onboarding */

function Onboarding({ overview }: { overview: Overview }) {
  const complete = useCompleteOnboarding();
  const natlas = overview.model.status;
  const steps = [
    {
      done: overview.projectCount > 0,
      title: 'Create a project',
      body: 'A project represents the AI application you want to evaluate.',
      href: '/projects?create=1',
      cta: 'Create project',
      icon: FolderPlus,
    },
    {
      done: false,
      title: 'Browse the benchmarks',
      body: 'Inspect the Nigerian Context Benchmark: prompts, reference facts and review status.',
      href: '/benchmarks',
      cta: 'View benchmarks',
      icon: BookOpen,
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
      icon: Cpu,
    },
    {
      done: overview.totals.runs > 0,
      title: 'Run your first evaluation',
      body: 'Pick a suite and languages; AtlasGuard records every response and check.',
      href: '/evaluations/new',
      cta: 'New evaluation',
      icon: Play,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  return (
    <Card variant="featured" className="mb-6 overflow-hidden">
      <ContourField preset="panel" className="opacity-60" />
      <div className="relative">
        <CardHeader
          action={
            <Button variant="ghost" size="icon-sm" onClick={() => complete.mutate()} aria-label="Dismiss onboarding">
              <X />
            </Button>
          }
        >
          <CardTitle>Get set up</CardTitle>
          <CardDescription className="max-w-2xl">
            AtlasGuard tests how reliably N-ATLaS answers across Yoruba, Hausa, Igbo and Nigerian English — and whether the facts stay the
            same from one language to another.
          </CardDescription>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-1 w-32 overflow-hidden rounded-full bg-white/[0.08]">
              <div className="h-full rounded-full bg-brand" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
            </div>
            <span className="text-xs text-muted-foreground tabular">
              {doneCount} of {steps.length} done
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2 xl:grid-cols-4">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <li key={s.title} className="flex flex-col gap-2 bg-[#15171d] p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-subtle-foreground">0{i + 1}</span>
                    {s.done ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-300">
                        <CircleCheck className="size-3.5" aria-hidden /> Done
                      </span>
                    ) : (
                      <Icon className="size-4 text-subtle-foreground" aria-hidden />
                    )}
                  </div>
                  <div className="text-sm font-medium">{s.title}</div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{s.body}</p>
                  <Link href={s.href} className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-medium text-violet-300 hover:text-violet-200">
                    {s.cta} <ArrowRight className="size-3" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------- hero */

function Metric({ label, value, hint, children }: { label: string; value: React.ReactNode; hint?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 px-5 py-4">
      <span className="eyebrow">{label}</span>
      <div className="flex items-end justify-between gap-3">
        <span className="text-xl leading-none font-semibold tracking-tight">{value}</span>
        {children}
      </div>
      {hint && <span className="truncate text-[11px] text-subtle-foreground">{hint}</span>}
    </div>
  );
}

function ReliabilityHero({ data }: { data: Overview }) {
  const t = data.totals;
  const runsPerDay = data.activity.map((d) => d.runs);
  return (
    <Card className="overflow-hidden lg:col-span-8">
      <div className="relative px-6 pt-6 pb-6">
        <ContourField preset="panel" className="opacity-50" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="eyebrow">Verified pass rate</span>
            <span className="font-mono text-[11px] text-subtle-foreground">PASSED ÷ (PASSED + FAILED)</span>
          </div>
          <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-1">
            <span className="text-[56px] leading-none font-semibold tracking-[-0.04em] text-foreground">{formatPercent(t.verifiedPassRate)}</span>
            <span className="pb-1.5 text-sm text-muted-foreground">
              {t.determinate ? `of ${formatNumber(t.determinate)} decided cases` : 'No decided cases yet'}
            </span>
          </div>
          <VerdictBar counts={data.verdictDistribution} size="lg" className="mt-6" />
        </div>
      </div>
      <div className="grid grid-cols-2 divide-border border-t border-border bg-white/[0.012] sm:grid-cols-4 sm:divide-x [&>*:nth-child(-n+2)]:border-b [&>*:nth-child(-n+2)]:border-border sm:[&>*:nth-child(-n+2)]:border-b-0">
        <Metric label="Runs" value={formatNumber(t.runs)} hint={`${data.projectCount} project${data.projectCount === 1 ? '' : 's'}`}>
          <Sparkline values={runsPerDay} width={64} height={22} label={`Runs per day over the last ${runsPerDay.length} days`} />
        </Metric>
        <Metric label="Cases evaluated" value={formatNumber(t.casesEvaluated)} />
        <Metric label="Needs review" value={<span className={cn(t.needsReview > 0 && 'text-amber-200')}>{formatNumber(t.needsReview)}</span>} hint="Awaiting a fluent reviewer" />
        <Metric label="Avg latency" value={formatMs(t.averageLatencyMs)} hint="Round trip per case" />
      </div>
    </Card>
  );
}

/* ---------------------------------------------------------------- page */

export default function OverviewPage() {
  const [includeSimulated, setIncludeSimulated] = React.useState(false);
  const me = useMe();
  const overview = useOverview(includeSimulated);
  const data = overview.data;
  const user = me.data?.user;
  const first = user?.name.split(' ')[0] ?? '';
  const onboarding = !!user && !user.onboardedAt;

  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}
        title={onboarding ? `Welcome to AtlasGuard, ${first}` : `${greeting()}, ${first}`}
        description="Reliability of N-ATLaS across your projects, computed from stored evaluation records."
        actions={
          <div className="flex h-9 items-center gap-2.5 rounded-lg bg-white/[0.03] px-3 inset-ring inset-ring-white/[0.08]">
            <Switch id="include-simulated" checked={includeSimulated} onCheckedChange={setIncludeSimulated} />
            <Label htmlFor="include-simulated" className="cursor-pointer text-[13px] font-normal text-muted-foreground">
              Include simulated runs
            </Label>
          </div>
        }
      />

      {overview.isLoading && (
        <div className="grid gap-4 lg:grid-cols-12" aria-label="Loading">
          <Skeleton className="h-[300px] rounded-xl lg:col-span-8" />
          <Skeleton className="h-[300px] rounded-xl lg:col-span-4" />
        </div>
      )}
      {overview.error && <ErrorState error={overview.error} onRetry={() => void overview.refetch()} />}

      {data && (
        <div className={cn('transition-opacity', overview.isFetching && overview.isPlaceholderData && 'opacity-60')}>
          {onboarding && <Onboarding overview={data} />}

          {includeSimulated && data.simulatedRunCount > 0 && (
            <p className="mb-4 rounded-lg border border-amber-400/20 bg-warning-soft px-3.5 py-2.5 text-xs text-amber-200">
              These figures include {data.simulatedRunCount} simulated (fixture) run{data.simulatedRunCount === 1 ? '' : 's'}. Simulated responses are
              not N-ATLaS output.
            </p>
          )}
          {!includeSimulated && data.totals.runs === 0 && data.simulatedRunCount > 0 && (
            <p className="mb-4 rounded-lg border border-border bg-card px-3.5 py-2.5 text-xs text-muted-foreground">
              No real N-ATLaS runs yet. {data.simulatedRunCount} simulated run{data.simulatedRunCount === 1 ? ' is' : 's are'} hidden — turn on “Include
              simulated runs” to see them.
            </p>
          )}

          {data.totals.runs === 0 ? (
            !onboarding && (
              <EmptyState
                icon={FlaskConical}
                title="No evaluation runs yet"
                description="Create a project, pick the Nigerian Context Benchmark and choose the languages to evaluate. Results appear here as soon as cases complete."
                action={
                  <>
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
                  </>
                }
              />
            )
          ) : (
            <div className="grid gap-4 lg:grid-cols-12">
              <ReliabilityHero data={data} />

              <Card className="lg:col-span-4">
                <CardHeader
                  action={
                    <Button asChild variant="ghost" size="xs">
                      <Link href="/insights">
                        Insights <ArrowRight />
                      </Link>
                    </Button>
                  }
                >
                  <CardTitle>Language health</CardTitle>
                  <CardDescription>Verified pass rate per language</CardDescription>
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
                  <p className="mt-5 border-t border-border pt-3 text-[11px] leading-relaxed text-subtle-foreground">
                    Needs-review cases and technical errors are excluded from the rate.
                  </p>
                </CardContent>
              </Card>

              <Card className="lg:col-span-7">
                <CardContent className="pt-5">
                  <ActivityChart data={data.activity} />
                </CardContent>
              </Card>

              <Card className="lg:col-span-5">
                <CardHeader
                  action={
                    <Button asChild variant="ghost" size="xs">
                      <Link href="/evaluations">
                        All runs <ArrowRight />
                      </Link>
                    </Button>
                  }
                >
                  <CardTitle>Recent runs</CardTitle>
                  <CardDescription>Latest evaluations across projects</CardDescription>
                </CardHeader>
                <CardContent className="px-2 pb-2">
                  <RunList runs={data.recentRuns.slice(0, 6)} compact />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </>
  );
}
