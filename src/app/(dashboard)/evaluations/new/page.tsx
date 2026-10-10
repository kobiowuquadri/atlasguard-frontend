'use client';

import { CircleAlert, Cpu, FlaskConical, Play, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';
import { LoadingRows, PageHeader } from '@/components/app/page';
import { SimulatedBadge } from '@/components/app/status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox, Field, Input, Label, Switch, Textarea } from '@/components/ui/form-controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { errorMessage } from '@/lib/api/client';
import { useBenchmark, useBenchmarkCases, useBenchmarks, useCreateRun, useModelConfigs, useProjects } from '@/lib/api/hooks';
import type { ModelConfig } from '@/lib/api/types';
import { CATEGORIES, LANGUAGES } from '@/lib/constants';
import { cn } from '@/lib/utils';

function Step({ n, title, children, description }: { n: number; title: string; description?: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex-row items-start gap-3">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-violet-200">{n}</span>
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      </CardHeader>
      <CardContent className="pl-14">{children}</CardContent>
    </Card>
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
    (c) =>
      languages.includes(c.language) &&
      (categories.length === 0 || categories.includes(c.category)) &&
      (!onlyVerified || c.reviewStatus === 'VERIFIED'),
  );
  const perLanguage = (code: string) => cases.filter((c) => c.language === code).length;
  const availableCategories = suite.data ? Object.keys(suite.data.stats.categories) : [];

  const toggle = (list: string[], value: string, set: (v: string[]) => void) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

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

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/evaluations" className="hover:text-foreground">
            Evaluations
          </Link>
        }
        title="New evaluation"
        description="Choose what to evaluate. The run executes in the background; you can follow its progress live."
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-4">
          <Step n={1} title="Project" description="The application this evaluation belongs to.">
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

          <Step n={2} title="Benchmark suite">
            <div className="grid gap-2 md:grid-cols-2">
              {suites.data?.items.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSuiteId(s.id);
                    setCategories([]);
                  }}
                  aria-pressed={suiteId === s.id}
                  className={cn(
                    'cursor-pointer rounded-md border p-3 text-left transition-colors',
                    suiteId === s.id ? 'border-primary bg-primary-soft' : 'border-border hover:bg-card-hover',
                  )}
                >
                  <div className="flex items-center justify-between gap-2 text-sm font-medium">
                    {s.name} <span className="font-mono text-xs text-subtle-foreground">v{s.version}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {s.stats.caseCount} cases · {s.stats.semanticGroupCount} semantic groups · {s.stats.verifiedCount} verified
                  </div>
                </button>
              ))}
            </div>
          </Step>

          <Step n={3} title="Languages" description="Cross-language consistency is analysed for every semantic group with at least two selected languages.">
            <div className="grid gap-2 sm:grid-cols-2">
              {LANGUAGES.map((l) => (
                <label key={l.code} className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 hover:bg-card-hover">
                  <Checkbox checked={languages.includes(l.code)} onCheckedChange={() => toggle(languages, l.code, setLanguages)} />
                  <span className="flex-1 text-sm">
                    {l.name} <span className="text-xs text-subtle-foreground">· {l.nativeName}</span>
                  </span>
                  {suiteId && <span className="text-xs text-muted-foreground tabular">{perLanguage(l.code)} cases</span>}
                </label>
              ))}
            </div>
            {availableCategories.length > 1 && (
              <div className="mt-4">
                <Label className="text-xs text-muted-foreground">Categories (optional — all when none selected)</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {availableCategories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggle(categories, c, setCategories)}
                      aria-pressed={categories.includes(c)}
                      className={cn(
                        'cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors',
                        categories.includes(c) ? 'border-primary bg-primary-soft text-violet-100' : 'border-border text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {CATEGORIES[c] ?? c}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <label className="mt-4 flex items-center gap-2 text-sm">
              <Switch checked={onlyVerified} onCheckedChange={setOnlyVerified} disabled={!suite.data?.stats.verifiedCount} />
              Only human-verified cases
              {suite.data && !suite.data.stats.verifiedCount && <span className="text-xs text-subtle-foreground">(none verified yet)</span>}
            </label>
          </Step>

          <Step n={4} title="Model configuration">
            <div className="grid gap-2 md:grid-cols-2">
              {configs.data?.map((c) => {
                const usable = c.availability === 'available';
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={!usable}
                    onClick={() => {
                      setConfigId(c.id);
                      setParams(defaultsFor(c));
                      setAcknowledgeSimulated(false);
                    }}
                    aria-pressed={configId === c.id}
                    className={cn(
                      'rounded-md border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                      configId === c.id ? 'border-primary bg-primary-soft' : 'cursor-pointer border-border hover:bg-card-hover',
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {c.isSimulated ? <FlaskConical className="size-4 text-amber-300" /> : <Cpu className="size-4 text-violet-300" />}
                      {c.isSimulated ? 'Development fixtures' : 'N-ATLaS'}
                      {c.isSimulated && <SimulatedBadge />}
                    </div>
                    <div className="mt-1 font-mono text-xs text-subtle-foreground">{c.modelIdentifier}</div>
                    <div className={cn('mt-2 text-xs', usable ? 'text-green-300' : 'text-red-300')}>
                      {usable ? 'Available' : c.availability === 'not_configured' ? 'Not configured on this server' : 'Unavailable'}
                    </div>
                    {!usable && c.availabilityMessage && <div className="mt-1 text-xs text-muted-foreground">{c.availabilityMessage}</div>}
                  </button>
                );
              })}
            </div>
            {simulated && (
              <div className="mt-3 rounded-md border border-warning/30 bg-warning-soft p-3 text-sm text-amber-100">
                <p className="flex items-center gap-2 font-medium">
                  <CircleAlert className="size-4" /> Simulated run
                </p>
                <p className="mt-1 text-xs text-amber-200/90">
                  Fixture responses are hand-written test data, not N-ATLaS output. The run will be labelled simulated everywhere and
                  cannot be exported as integration evidence.
                </p>
                <label className="mt-2 flex items-center gap-2 text-xs">
                  <Checkbox checked={acknowledgeSimulated} onCheckedChange={(v) => setAcknowledgeSimulated(v === true)} /> I understand this run
                  is simulated
                </label>
              </div>
            )}
          </Step>

          <Step n={5} title="Inference parameters" description="Defaults come from the selected configuration; for N-ATLaS they follow the model card (temperature 0.1, repetition penalty 1.12).">
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
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setParams(defaultsFor(selectedConfig))}>
                <RotateCcw /> Reset to defaults
              </Button>
            )}
            {paramErrors.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-xs text-red-300" role="alert">
                {paramErrors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </Step>
        </div>

        <aside className="xl:sticky xl:top-20 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Review</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <dl className="grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-2">
                <dt className="text-muted-foreground">Project</dt>
                <dd>{projects.data?.items.find((p) => p.id === projectId)?.name ?? '—'}</dd>
                <dt className="text-muted-foreground">Suite</dt>
                <dd>{suite.data ? `${suite.data.name} v${suite.data.version}` : '—'}</dd>
                <dt className="text-muted-foreground">Languages</dt>
                <dd>{languages.length ? LANGUAGES.filter((l) => languages.includes(l.code)).map((l) => l.name).join(', ') : '—'}</dd>
                <dt className="text-muted-foreground">Categories</dt>
                <dd>{categories.length ? categories.map((c) => CATEGORIES[c] ?? c).join(', ') : 'All'}</dd>
                <dt className="text-muted-foreground">Model</dt>
                <dd className="break-all">
                  {selectedConfig ? (
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-xs">{selectedConfig.modelIdentifier}</span>
                      {selectedConfig.isSimulated && <SimulatedBadge />}
                    </span>
                  ) : (
                    '—'
                  )}
                </dd>
                <dt className="text-muted-foreground">Cases</dt>
                <dd className="font-semibold tabular">
                  {suiteId ? `${exactCounts ? '' : '≈ '}${matching.length}` : '—'}
                </dd>
              </dl>
              {createRun.error && (
                <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-xs text-red-200">
                  {errorMessage(createRun.error)}
                </p>
              )}
              {configs.data && !configs.data.some((c) => c.providerType === 'NATLAS' && c.availability === 'available') && (
                <p className="rounded-md border border-border bg-background-subtle px-3 py-2 text-xs text-muted-foreground">
                  N-ATLaS is not reachable on this server right now, so real evaluations can’t start. AtlasGuard will not substitute
                  another model.
                </p>
              )}
              <Button onClick={start} disabled={!ready} loading={createRun.isPending} size="lg" className="w-full">
                <Play /> Start evaluation
              </Button>
              {!ready && (
                <p className="text-xs text-subtle-foreground">
                  {!projectId
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
                                : null}
                </p>
              )}
              {selectedConfig && !selectedConfig.isSimulated && (
                <Badge variant="primary" className="self-start">
                  Real N-ATLaS inference
                </Badge>
              )}
            </CardContent>
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
