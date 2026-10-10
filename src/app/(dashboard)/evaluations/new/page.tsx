'use client';

import { Check, CircleAlert, Cpu, FlaskConical, Play, RotateCcw, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';
import { LoadingRows, PageHeader } from '@/components/app/page';
import { LanguageChip, SimulatedBadge, StatusDot } from '@/components/app/status';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox, Field, Input, Label, Switch, Textarea } from '@/components/ui/form-controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { errorMessage } from '@/lib/api/client';
import { useBenchmark, useBenchmarkCases, useBenchmarks, useCreateRun, useModelConfigs, useProjects } from '@/lib/api/hooks';
import type { ModelConfig } from '@/lib/api/types';
import { CATEGORIES, LANGUAGES } from '@/lib/constants';
import { cn } from '@/lib/utils';

/* A numbered rail: each step's circle fills in once that step is complete. */
function Step({ n, title, description, done, last = false, children }: { n: number; title: string; description?: string; done: boolean; last?: boolean; children: React.ReactNode }) {
  return (
    <section className="relative grid grid-cols-[2rem_minmax(0,1fr)] gap-x-4 sm:gap-x-5">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold transition-colors',
            done ? 'bg-primary text-white shadow-[0_0_0_4px_rgb(124_58_237/0.18)]' : 'bg-white/[0.05] text-muted-foreground inset-ring inset-ring-white/12',
          )}
          aria-hidden
        >
          {done ? <Check className="size-4" strokeWidth={3} /> : n}
        </span>
        {!last && <span className={cn('mt-2 w-px flex-1', done ? 'bg-gradient-to-b from-violet-500/60 to-white/10' : 'bg-white/10')} aria-hidden />}
      </div>
      <div className={cn('min-w-0', last ? 'pb-2' : 'pb-10')}>
        <h2 className="pt-1 text-[15px] font-semibold tracking-tight">
          <span className="sr-only">Step {n}: </span>
          {title}
        </h2>
        {description && <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">{description}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </section>
  );
}

/** Radio-style selectable card with a corner check. */
function ChoiceCard({ selected, disabled, onClick, children, className }: { selected: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'relative cursor-pointer rounded-xl border p-4 text-left transition-[border-color,background-color,box-shadow] disabled:cursor-not-allowed disabled:opacity-55',
        selected
          ? 'border-violet-400/60 bg-primary-soft shadow-[0_0_0_3px_rgb(124_58_237/0.14)]'
          : 'border-border bg-card hover:border-white/15 hover:bg-card-hover',
        className,
      )}
    >
      {selected && (
        <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-primary text-white" aria-hidden>
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}
      {children}
    </button>
  );
}

interface Params {
  temperature: string;
  maxTokens: string;
  repetitionPenalty: string;
  topP: string;
  seed: string;
  systemPrompt: string;
}

function defaultsFor(config?: ModelConfig): Params {
  const d = config?.defaultParameters;
  return {
    temperature: String(d?.temperature ?? 0.1),
    maxTokens: String(d?.maxTokens ?? 512),
    repetitionPenalty: d?.repetitionPenalty !== undefined ? String(d.repetitionPenalty) : '',
    topP: d?.topP !== undefined ? String(d.topP) : '',
    seed: '',
    systemPrompt: d?.systemPrompt ?? '',
  };
}

function NewEvaluation() {
  const router = useRouter();
  const search = useSearchParams();
  const projects = useProjects();
  const suites = useBenchmarks();
  const configs = useModelConfigs();
  const createRun = useCreateRun();

  const [projectId, setProjectId] = React.useState(search.get('projectId') ?? '');
  const [suiteId, setSuiteId] = React.useState(search.get('suiteId') ?? '');
  const [languages, setLanguages] = React.useState<string[]>(['en-NG', 'yo', 'ha', 'ig']);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [onlyVerified, setOnlyVerified] = React.useState(false);
  const [configId, setConfigId] = React.useState('');
  const [params, setParams] = React.useState<Params>(defaultsFor());
  const [editParams, setEditParams] = React.useState(false);
  const [acknowledgeSimulated, setAcknowledgeSimulated] = React.useState(false);

  const suite = useBenchmark(suiteId || undefined);
  const suiteCases = useBenchmarkCases(suiteId || undefined, { pageSize: 100 });
  const selectedConfig = configs.data?.find((c) => c.id === configId);

  // Default to the real N-ATLaS configuration when it is available — never to fixtures.
  React.useEffect(() => {
    if (configId || !configs.data) return;
    const natlas = configs.data.find((c) => c.providerType === 'NATLAS' && c.availability === 'available');
    if (natlas) {
      setConfigId(natlas.id);
      setParams(defaultsFor(natlas));
    }
  }, [configs.data, configId]);
  React.useEffect(() => {
    if (!projectId && projects.data?.items.length === 1) setProjectId(projects.data.items[0]!.id);
  }, [projects.data, projectId]);
  React.useEffect(() => {
    if (!suiteId && suites.data?.items.length === 1) setSuiteId(suites.data.items[0]!.id);
  }, [suites.data, suiteId]);

  const cases = suiteCases.data?.items ?? [];
  const exactCounts = suiteCases.data ? suiteCases.data.meta.total <= cases.length : false;
  const matching = cases.filter(
    (c) => languages.includes(c.language) && (categories.length === 0 || categories.includes(c.category)) && (!onlyVerified || c.reviewStatus === 'VERIFIED'),
  );
  const perLanguage = (code: string) => cases.filter((c) => c.language === code).length;
  const matchingFor = (code: string) => matching.filter((c) => c.language === code).length;
  const availableCategories = suite.data ? Object.keys(suite.data.stats.categories) : [];

  const toggle = (list: string[], value: string, set: (v: string[]) => void) => set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const num = (v: string) => (v.trim() === '' ? undefined : Number(v));
  const paramErrors: string[] = [];
  const t = num(params.temperature);
  if (t === undefined || Number.isNaN(t) || t < 0 || t > 2) paramErrors.push('Temperature must be between 0 and 2.');
  const mt = num(params.maxTokens);
  if (mt === undefined || !Number.isInteger(mt) || mt < 16 || mt > 2048) paramErrors.push('Max tokens must be a whole number between 16 and 2048.');
  const rp = num(params.repetitionPenalty);
  if (rp !== undefined && (Number.isNaN(rp) || rp < 1 || rp > 2)) paramErrors.push('Repetition penalty must be between 1 and 2.');
  const tp = num(params.topP);
  if (tp !== undefined && (Number.isNaN(tp) || tp <= 0 || tp > 1)) paramErrors.push('Top-p must be greater than 0 and at most 1.');
  const sd = num(params.seed);
  if (sd !== undefined && (!Number.isInteger(sd) || sd < 0)) paramErrors.push('Seed must be a non-negative whole number.');

  const simulated = !!selectedConfig?.isSimulated;
  const configUsable = !!selectedConfig && selectedConfig.availability === 'available';
  const ready =
    !!projectId && !!suiteId && languages.length > 0 && configUsable && paramErrors.length === 0 && matching.length > 0 && (!simulated || acknowledgeSimulated);
  const natlasReachable = !!configs.data?.some((c) => c.providerType === 'NATLAS' && c.availability === 'available');

  const start = () =>
    createRun.mutate(
      {
        projectId,
        suiteId,
        languages,
        categories: categories.length ? categories : undefined,
        onlyVerified: onlyVerified || undefined,
        modelConfigurationId: configId,
        parameters: {
          temperature: t!,
          maxTokens: mt!,
          ...(rp !== undefined && { repetitionPenalty: rp }),
          ...(tp !== undefined && { topP: tp }),
          ...(sd !== undefined && { seed: sd }),
          systemPrompt: params.systemPrompt,
        },
      },
      {
        onSuccess: (run) => {
          toast.success('Evaluation queued');
          router.push(`/evaluations/${run.id}`);
        },
      },
    );

  if (projects.isLoading || suites.isLoading || configs.isLoading) return <LoadingRows rows={6} />;

  const blocker = !projectId
    ? 'Select a project.'
    : !suiteId
      ? 'Select a benchmark suite.'
      : languages.length === 0
        ? 'Select at least one language.'
        : !configUsable
          ? 'Select an available model configuration.'
          : simulated && !acknowledgeSimulated
            ? 'Confirm that this run is simulated.'
            : matching.length === 0
              ? 'No cases match the current selection.'
              : paramErrors.length
                ? 'Fix the inference parameters.'
                : null;

  return (
    <>
      <PageHeader
        eyebrow="Evaluations"
        title="New evaluation"
        description="Choose what to evaluate. The run executes in the background; you can follow its progress live."
      />
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div>
          <Step n={1} title="Project" description="The application this evaluation belongs to." done={!!projectId}>
            {projects.data?.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You have no projects yet.{' '}
                <Link href="/projects?create=1" className="text-violet-300 hover:underline">
                  Create one first
                </Link>
                .
              </p>
            ) : (
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger aria-label="Project" className="max-w-md">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.data?.items.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </Step>

          <Step n={2} title="Benchmark suite" description="Versioned prompts with reference facts in each language." done={!!suiteId}>
            <div className="grid gap-3 md:grid-cols-2">
              {suites.data?.items.map((s) => (
                <ChoiceCard
                  key={s.id}
                  selected={suiteId === s.id}
                  onClick={() => {
                    setSuiteId(s.id);
                    setCategories([]);
                  }}
                >
                  <div className="pr-7 text-sm font-medium">{s.name}</div>
                  <div className="mt-1 font-mono text-[11px] text-subtle-foreground">
                    {s.namespace}/{s.slug} · v{s.version}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{s.stats.caseCount} cases</span>
                    <span>{s.stats.semanticGroupCount} semantic groups</span>
                    <span>{s.stats.verifiedCount} verified</span>
                  </div>
                </ChoiceCard>
              ))}
            </div>
          </Step>

          <Step
            n={3}
            title="Languages"
            description="Cross-language consistency is analysed for every semantic group with at least two selected languages."
            done={languages.length > 0}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {LANGUAGES.map((l) => {
                const on = languages.includes(l.code);
                return (
                  <label
                    key={l.code}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors',
                      on ? 'border-violet-400/40 bg-primary-soft/60' : 'border-border bg-card hover:bg-card-hover',
                    )}
                  >
                    <Checkbox checked={on} onCheckedChange={() => toggle(languages, l.code, setLanguages)} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{l.name}</span>
                      {l.nativeName !== l.name && <span className="block font-serif text-[15px] leading-tight text-muted-foreground italic">{l.nativeName}</span>}
                    </span>
                    <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10.5px] text-slate-300">{l.short}</span>
                    {suiteId && <span className="w-14 text-right text-xs text-muted-foreground tabular">{perLanguage(l.code)} cases</span>}
                  </label>
                );
              })}
            </div>
            {availableCategories.length > 1 && (
              <div className="mt-5">
                <Label className="text-xs font-normal text-muted-foreground">Categories — optional, all when none selected</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {availableCategories.map((c) => {
                    const on = categories.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggle(categories, c, setCategories)}
                        aria-pressed={on}
                        className={cn(
                          'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs transition-colors inset-ring',
                          on ? 'bg-primary-soft text-violet-100 inset-ring-violet-400/40' : 'text-muted-foreground inset-ring-white/10 hover:text-foreground',
                        )}
                      >
                        {on && <Check className="size-3" strokeWidth={3} aria-hidden />}
                        {CATEGORIES[c] ?? c}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <label className="mt-5 flex items-center gap-2.5 text-[13px]">
              <Switch checked={onlyVerified} onCheckedChange={setOnlyVerified} disabled={!suite.data?.stats.verifiedCount} />
              Only human-verified cases
              {suite.data && !suite.data.stats.verifiedCount && <span className="text-xs text-subtle-foreground">(none verified yet)</span>}
            </label>
          </Step>

          <Step n={4} title="Model configuration" description="AtlasGuard never substitutes another model when N-ATLaS is unavailable." done={configUsable}>
            <div className="grid gap-3 md:grid-cols-2">
              {configs.data?.map((c) => {
                const usable = c.availability === 'available';
                return (
                  <ChoiceCard
                    key={c.id}
                    selected={configId === c.id}
                    disabled={!usable}
                    onClick={() => {
                      setConfigId(c.id);
                      setParams(defaultsFor(c));
                      setAcknowledgeSimulated(false);
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-2 pr-7 text-sm font-medium">
                      {c.isSimulated ? <FlaskConical className="size-4 text-amber-300" aria-hidden /> : <Cpu className="size-4 text-violet-300" aria-hidden />}
                      {c.isSimulated ? 'Development fixtures' : 'N-ATLaS'}
                      {c.isSimulated && <SimulatedBadge />}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-subtle-foreground">{c.modelIdentifier}</div>
                    <div className={cn('mt-3 flex items-center gap-1.5 text-xs', usable ? 'text-green-300' : 'text-red-300')}>
                      <StatusDot tone={usable ? 'success' : c.availability === 'not_configured' ? 'neutral' : 'danger'} />
                      {usable ? 'Available' : c.availability === 'not_configured' ? 'Not configured on this server' : 'Unavailable'}
                    </div>
                    {!usable && c.availabilityMessage && <div className="mt-1 text-xs text-muted-foreground">{c.availabilityMessage}</div>}
                  </ChoiceCard>
                );
              })}
            </div>
            {simulated && (
              <div className="mt-3 rounded-xl border border-amber-400/25 bg-warning-soft p-4 text-sm text-amber-100">
                <p className="flex items-center gap-2 font-medium">
                  <CircleAlert className="size-4" aria-hidden /> Simulated run
                </p>
                <p className="mt-1 text-xs leading-relaxed text-amber-200/90">
                  Fixture responses are hand-written test data, not N-ATLaS output. The run will be labelled simulated everywhere and cannot be
                  exported as integration evidence.
                </p>
                <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs">
                  <Checkbox checked={acknowledgeSimulated} onCheckedChange={(v) => setAcknowledgeSimulated(v === true)} /> I understand this run is
                  simulated
                </label>
              </div>
            )}
          </Step>

          <Step
            n={5}
            last
            title="Inference parameters"
            description="Defaults come from the selected configuration; for N-ATLaS they follow the model card (temperature 0.1, repetition penalty 1.12)."
            done={!!selectedConfig && paramErrors.length === 0}
          >
            {!editParams ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-inset px-4 py-3">
                <span className="font-mono text-xs text-muted-foreground">
                  temperature {params.temperature || '—'} · max tokens {params.maxTokens || '—'}
                  {params.repetitionPenalty && ` · repetition penalty ${params.repetitionPenalty}`}
                  {params.topP && ` · top-p ${params.topP}`}
                  {params.seed && ` · seed ${params.seed}`}
                  {params.systemPrompt ? ' · system prompt set' : ' · no system prompt'}
                </span>
                <Button variant="secondary" size="sm" onClick={() => setEditParams(true)}>
                  <SlidersHorizontal /> Customise
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Temperature" htmlFor="p-temp">
                    <Input id="p-temp" inputMode="decimal" value={params.temperature} onChange={(e) => setParams({ ...params, temperature: e.target.value })} />
                  </Field>
                  <Field label="Max tokens" htmlFor="p-max">
                    <Input id="p-max" inputMode="numeric" value={params.maxTokens} onChange={(e) => setParams({ ...params, maxTokens: e.target.value })} />
                  </Field>
                  <Field label="Repetition penalty" htmlFor="p-rep" hint="Optional">
                    <Input id="p-rep" inputMode="decimal" value={params.repetitionPenalty} onChange={(e) => setParams({ ...params, repetitionPenalty: e.target.value })} />
                  </Field>
                  <Field label="Top-p" htmlFor="p-topp" hint="Optional">
                    <Input id="p-topp" inputMode="decimal" value={params.topP} onChange={(e) => setParams({ ...params, topP: e.target.value })} />
                  </Field>
                  <Field label="Seed" htmlFor="p-seed" hint="Optional, for sampling reproducibility">
                    <Input id="p-seed" inputMode="numeric" value={params.seed} onChange={(e) => setParams({ ...params, seed: e.target.value })} />
                  </Field>
                </div>
                <Field label="System prompt" htmlFor="p-system" className="mt-3" hint="Leave empty to send no system prompt.">
                  <Textarea id="p-system" rows={3} value={params.systemPrompt} onChange={(e) => setParams({ ...params, systemPrompt: e.target.value })} />
                </Field>
                {selectedConfig && (
                  <Button variant="ghost" size="sm" className="mt-3" onClick={() => setParams(defaultsFor(selectedConfig))}>
                    <RotateCcw /> Reset to defaults
                  </Button>
                )}
              </div>
            )}
            {paramErrors.length > 0 && (
              <ul className="mt-3 list-disc pl-5 text-xs text-red-300" role="alert">
                {paramErrors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </Step>
        </div>

        <aside className="xl:sticky xl:top-20 xl:self-start">
          <Card className="overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <div className="eyebrow">Run plan</div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-[44px] leading-none font-semibold tracking-[-0.03em]">{suiteId ? matching.length : '—'}</span>
                <span className="pb-1 text-sm text-muted-foreground">{suiteId && !exactCounts ? '≈ cases' : 'cases'}</span>
              </div>
              {suiteId && languages.length > 0 && (
                <ul className="mt-4 flex flex-col gap-2">
                  {LANGUAGES.filter((l) => languages.includes(l.code)).map((l) => {
                    const n = matchingFor(l.code);
                    const max = Math.max(1, ...LANGUAGES.map((x) => matchingFor(x.code)));
                    return (
                      <li key={l.code} className="grid grid-cols-[2.25rem_minmax(0,1fr)_2rem] items-center gap-2.5 text-xs">
                        <span className="font-mono text-[10.5px] text-slate-300">{l.short}</span>
                        <span className="h-1.5 rounded-full bg-white/[0.06]">
                          <span className="block h-full rounded-full bg-[#8b5cf6]" style={{ width: `${(n / max) * 100}%` }} />
                        </span>
                        <span className="text-right text-muted-foreground tabular">{n}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-2.5 px-5 py-4 text-[13px]">
              <dt className="text-muted-foreground">Project</dt>
              <dd className="truncate">{projects.data?.items.find((p) => p.id === projectId)?.name ?? '—'}</dd>
              <dt className="text-muted-foreground">Suite</dt>
              <dd>{suite.data ? `${suite.data.name} v${suite.data.version}` : '—'}</dd>
              <dt className="text-muted-foreground">Languages</dt>
              <dd className="flex flex-wrap gap-1">
                {languages.length ? LANGUAGES.filter((l) => languages.includes(l.code)).map((l) => <LanguageChip key={l.code} code={l.code} compact />) : '—'}
              </dd>
              <dt className="text-muted-foreground">Categories</dt>
              <dd>{categories.length ? categories.map((c) => CATEGORIES[c] ?? c).join(', ') : 'All'}</dd>
              <dt className="text-muted-foreground">Model</dt>
              <dd className="min-w-0">
                {selectedConfig ? (
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate font-mono text-xs">{selectedConfig.modelIdentifier}</span>
                    {selectedConfig.isSimulated && <SimulatedBadge />}
                  </span>
                ) : (
                  '—'
                )}
              </dd>
            </dl>
            <div className="flex flex-col gap-3 border-t border-border bg-white/[0.012] px-5 py-4">
              {createRun.error && (
                <p role="alert" className="rounded-lg border border-red-400/20 bg-danger-soft px-3 py-2 text-xs text-red-200">
                  {errorMessage(createRun.error)}
                </p>
              )}
              {configs.data && !natlasReachable && (
                <p className="rounded-lg bg-white/[0.03] px-3 py-2.5 text-xs leading-relaxed text-muted-foreground inset-ring inset-ring-white/[0.07]">
                  N-ATLaS is not reachable on this server right now, so real evaluations can’t start. AtlasGuard will not substitute another model.
                </p>
              )}
              <Button onClick={start} disabled={!ready} loading={createRun.isPending} size="lg" className="w-full">
                <Play /> Start evaluation
              </Button>
              {blocker ? (
                <p className="text-center text-xs text-subtle-foreground">{blocker}</p>
              ) : selectedConfig && !selectedConfig.isSimulated ? (
                <p className="flex items-center justify-center gap-1.5 text-xs text-violet-200">
                  <ShieldCheck className="size-3.5" aria-hidden /> Real N-ATLaS inference
                </p>
              ) : null}
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}

export default function NewEvaluationPage() {
  return (
    <React.Suspense fallback={<LoadingRows rows={6} />}>
      <NewEvaluation />
    </React.Suspense>
  );
}
