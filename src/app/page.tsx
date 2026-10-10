import {
  ArrowRight,
  BookOpen,
  CircleAlert,
  CircleCheck,
  CircleMinus,
  CircleX,
  Code2,
  FileText,
  FlaskConical,
  GitCompareArrows,
  Hash,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/app/logo';
import { ContourField, GridBackdrop } from '@/components/app/patterns';
import { Button } from '@/components/ui/button';
import { NATLAS_ATTRIBUTION } from '@/lib/constants';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ data */

const LANGS = [
  { code: 'EN', name: 'Nigerian English', native: 'Nigerian English' },
  { code: 'YO', name: 'Yoruba', native: 'Èdè Yorùbá' },
  { code: 'HA', name: 'Hausa', native: 'Harshen Hausa' },
  { code: 'IG', name: 'Igbo', native: 'Asụsụ Igbo' },
];

type Cell = 'ok' | 'review' | 'missing' | 'conflict';
const CELL = {
  ok: { icon: CircleCheck, color: 'text-success', label: 'Supported' },
  review: { icon: CircleAlert, color: 'text-warning', label: 'Uncertain' },
  missing: { icon: CircleMinus, color: 'text-warning', label: 'Missing' },
  conflict: { icon: CircleX, color: 'text-danger', label: 'Contradicted' },
} satisfies Record<Cell, { icon: typeof CircleCheck; color: string; label: string }>;

// Illustrative rows for the hero mock-up. Clearly labelled on screen: these are not model results.
const DEMO_ROWS: Array<{ title: string; key: string; cells: Array<[Cell, string]>; verdict: 'Inconsistent' | 'Consistent' | 'Needs review' }> = [
  { title: 'Bank transfer total with fee', key: 'fin.transfer-fee', cells: [['ok', '3/3'], ['ok', '3/3'], ['conflict', '2/3'], ['review', '2/3']], verdict: 'Inconsistent' },
  { title: 'Fertiliser dose per hectare', key: 'agro.npk-dose', cells: [['ok', '2/2'], ['ok', '2/2'], ['ok', '2/2'], ['ok', '2/2']], verdict: 'Consistent' },
  { title: 'Voter card collection steps', key: 'civic.pvc-steps', cells: [['ok', '3/3'], ['missing', '2/3'], ['ok', '3/3'], ['ok', '3/3']], verdict: 'Needs review' },
  { title: 'School fees instalments', key: 'edu.fees-plan', cells: [['ok', '2/2'], ['ok', '2/2'], ['review', '1/2'], ['ok', '2/2']], verdict: 'Needs review' },
];

const VERDICT_STYLE = {
  Inconsistent: 'bg-danger-soft text-red-300 inset-ring-red-400/25',
  Consistent: 'bg-success-soft text-green-300 inset-ring-green-400/25',
  'Needs review': 'bg-warning-soft text-amber-200 inset-ring-amber-400/25',
};

const FEATURES = [
  {
    icon: FlaskConical,
    title: 'Multilingual evaluation engine',
    body: 'Run benchmark suites against N-ATLaS and record the actual response, latency and every check — validity, language compliance, reference facts and instructions.',
  },
  {
    icon: BookOpen,
    title: 'Nigerian context benchmarks',
    body: 'Financial terminology, Nigerian English, education, civic information, culture and meaning preservation — with provenance and review status on every case.',
  },
  {
    icon: Code2,
    title: 'Developer API & SDK',
    body: 'A documented REST API with OpenAPI docs and a typed TypeScript SDK, so evaluations can run from CI and scripts.',
  },
  {
    icon: FileText,
    title: 'Reports you can reproduce',
    body: 'Every run stores the benchmark version, case snapshots, model revision and generation parameters. Export JSON, CSV or Markdown.',
  },
];

const STEPS = [
  { n: '01', title: 'Choose a benchmark', body: 'Start from the official Nigerian Context Benchmark or import your own suite with reference facts per language.' },
  { n: '02', title: 'Run it against N-ATLaS', body: 'AtlasGuard sends every prompt, captures the raw response and timing, and scores it with transparent, rule-based checks.' },
  { n: '03', title: 'Compare, review, export', body: 'See where languages disagree, send uncertain cases to a fluent reviewer, then export a reproducible report.' },
];

const PRINCIPLES = [
  'Simulated fixtures are always labelled and can never be exported as N-ATLaS evidence.',
  'Technical errors are never counted as model failures.',
  'Uncertain automated judgements go to human review instead of becoming passes.',
  'AI-drafted translations stay “pending review” until a fluent speaker verifies them.',
];

const SDK_SNIPPET = `import { AtlasGuard } from '@atlasguard/sdk';

const atlas = new AtlasGuard({ baseUrl, apiKey });

const run = await atlas.evaluations.run({
  projectId,
  suiteId: 'nigerian-context-v1',
  languages: ['en-NG', 'yo', 'ha', 'ig'],
});

const done = await atlas.evaluations.waitForCompletion(run.id);
const groups = await atlas.evaluations.consistency(run.id);`;

/* ------------------------------------------------------------ fragments */

function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('font-mono text-[11px] tracking-[0.08em] text-violet-300/90 uppercase', className)}>{children}</p>;
}

function HeroMock() {
  return (
    <div className="relative mx-auto mt-16 max-w-5xl sm:mt-20">
      <div aria-hidden className="absolute -inset-x-10 -top-10 -bottom-16 rounded-[40px] bg-[radial-gradient(closest-side,rgb(124_58_237/0.20),transparent)]" />
      <figure className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#101217]/90 shadow-[0_40px_120px_-40px_rgb(0_0_0/0.9),0_0_0_1px_rgb(255_255_255/0.03)] backdrop-blur">
        <div className="flex items-center gap-3 border-b border-white/[0.07] bg-white/[0.02] px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-white/10" />
            <span className="size-2.5 rounded-full bg-white/10" />
            <span className="size-2.5 rounded-full bg-white/10" />
          </span>
          <span className="truncate font-mono text-[11px] text-subtle-foreground">Consistency map · Nigerian Context Benchmark</span>
          <span className="ml-auto shrink-0 rounded-full bg-warning-soft px-2 py-0.5 text-[10.5px] font-medium text-amber-200 inset-ring inset-ring-amber-400/25">
            Illustrative example — not model results
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th scope="col" className="px-5 py-3">
                  <span className="eyebrow">Semantic group</span>
                </th>
                {LANGS.map((l) => (
                  <th key={l.code} scope="col" className="px-3 py-3 font-normal">
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-slate-300">
                      <span className="rounded-full bg-white/[0.07] px-1.5 py-0.5 font-mono text-[10px] text-slate-200">{l.code}</span>
                      <span className="hidden md:inline">{l.name}</span>
                    </span>
                  </th>
                ))}
                <th scope="col" className="px-5 py-3 text-right">
                  <span className="eyebrow">Verdict</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {DEMO_ROWS.map((row) => (
                <tr key={row.key} className="border-b border-white/[0.05] last:border-0">
                  <th scope="row" className="px-5 py-3.5 font-normal">
                    <span className="block font-medium text-foreground">{row.title}</span>
                    <span className="block font-mono text-[11px] text-subtle-foreground">{row.key}</span>
                  </th>
                  {row.cells.map(([state, score], i) => {
                    const meta = CELL[state];
                    const Icon = meta.icon;
                    return (
                      <td key={i} className="px-3 py-3.5">
                        <span
                          className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-1', state === 'conflict' && 'bg-danger-soft inset-ring inset-ring-red-400/25')}
                          title={meta.label}
                        >
                          <Icon className={cn('size-4', meta.color)} aria-label={meta.label} />
                          <span className="font-mono text-[11px] text-muted-foreground">{score}</span>
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-5 py-3.5 text-right">
                    <span className={cn('inline-flex h-[22px] items-center rounded-full px-2 text-[11.5px] font-medium inset-ring', VERDICT_STYLE[row.verdict])}>{row.verdict}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </figure>

      {/* Floating finding card */}
      <div className="relative mx-4 mt-3 rounded-xl border border-red-400/20 bg-[#16131a]/95 p-4 shadow-pop backdrop-blur sm:absolute sm:right-[-1.5rem] sm:-bottom-[6.75rem] sm:mx-0 sm:mt-0 sm:w-[340px]">
        <div className="flex items-center gap-2">
          <CircleX className="size-4 text-danger" aria-hidden />
          <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-slate-200">numeric_conflict</code>
          <span className="text-[11px] text-subtle-foreground">fact:total-deducted</span>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-300">The same transfer question, two different totals:</p>
        <div className="mt-2.5 flex gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] py-0.5 pr-2.5 pl-0.5 inset-ring inset-ring-white/10">
            <span className="rounded-full bg-white/[0.07] px-1.5 py-0.5 font-mono text-[10px]">EN</span>
            <span className="font-mono text-xs">₦5,050</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft py-0.5 pr-2.5 pl-0.5 inset-ring inset-ring-red-400/25">
            <span className="rounded-full bg-white/[0.07] px-1.5 py-0.5 font-mono text-[10px]">HA</span>
            <span className="font-mono text-xs text-red-200">₦5,500</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- page */

export default function LandingPage() {
  return (
    <div className="min-h-dvh overflow-x-clip">
      <header className="sticky top-0 z-40 border-b border-white/[0.04] bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="rounded-md">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-7 text-[13px] text-muted-foreground md:flex" aria-label="Sections">
            <a href="#consistency" className="transition-colors hover:text-foreground">
              Consistency
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#developers" className="transition-colors hover:text-foreground">
              Developers
            </a>
            <a href="#integrity" className="transition-colors hover:text-foreground">
              Integrity
            </a>
          </nav>
          <nav className="flex items-center gap-2" aria-label="Account">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main id="main">
        {/* ------------------------------------------------------------ hero */}
        <section className="relative isolate">
          <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
            <ContourField className="opacity-90 [mask-image:radial-gradient(ellipse_at_60%_30%,black_20%,transparent_70%)]" />
            <GridBackdrop />
          </div>
          <div className="mx-auto max-w-6xl px-4 pt-20 pb-28 text-center sm:px-6 sm:pt-28 sm:pb-40">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] py-1.5 pr-3.5 pl-2 text-xs text-muted-foreground inset-ring inset-ring-white/10 animate-enter">
              <span className="flex size-5 items-center justify-center rounded-full bg-primary-soft inset-ring inset-ring-violet-400/25">
                <ShieldCheck className="size-3 text-violet-200" aria-hidden />
              </span>
              Developer infrastructure for N-ATLaS
            </p>
            <h1 className="mx-auto mt-7 max-w-4xl text-[44px] leading-[1.02] font-semibold tracking-[-0.035em] text-balance animate-enter sm:text-6xl lg:text-[76px]">
              Engineering Trust in{' '}
              <span className="font-serif text-[1.08em] font-normal tracking-[-0.01em] italic text-brand">Nigerian AI.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground animate-enter sm:text-lg">
              AtlasGuard makes N-ATLaS measurable. Benchmark Yoruba, Hausa, Igbo and Nigerian English responses, catch answers that
              change meaning between languages, and keep every result reproducible.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3 animate-enter">
              <Button asChild size="lg">
                <Link href="/signup">
                  Start evaluating <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <a href="#how">See how it works</a>
              </Button>
            </div>

            <HeroMock />
          </div>
        </section>

        {/* ------------------------------------------------------- languages */}
        <section aria-label="Languages" className="border-y border-white/[0.05] bg-panel/60">
          <div className="mx-auto grid max-w-6xl grid-cols-2 divide-white/[0.05] px-4 sm:px-6 md:grid-cols-4 md:divide-x">
            {LANGS.map((l) => (
              <div key={l.code} className="flex items-center gap-3 px-2 py-6 md:px-6">
                <span className="rounded-md bg-white/[0.05] px-2 py-1 font-mono text-[11px] text-slate-300 inset-ring inset-ring-white/10">{l.code}</span>
                <span>
                  <span className="block font-serif text-xl leading-tight text-foreground italic">{l.native}</span>
                  <span className="block text-xs text-subtle-foreground">{l.name}</span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ----------------------------------------------------- consistency */}
        <section id="consistency" className="scroll-mt-20">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:py-32">
            <div>
              <Eyebrow>Signature capability</Eyebrow>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.025em] text-balance sm:text-[40px] sm:leading-[1.1]">
                Cross-language consistency detection
              </h2>
              <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">
                Ask the same question in four languages and AtlasGuard checks each answer against shared reference facts. It separates
                confirmed contradictions (₦5,050 in English, ₦5,500 in Hausa) from omissions and from findings that need a fluent
                reviewer — and shows the responses side by side.
              </p>
              <ul className="mt-8 flex flex-col gap-4">
                {[
                  [CircleX, 'text-danger', 'Confirmed contradiction', 'Two languages state different values for the same numeric or named fact.'],
                  [CircleMinus, 'text-warning', 'Omission', 'A required fact is missing from one language — reported, never counted as a contradiction.'],
                  [CircleAlert, 'text-warning', 'Needs a fluent reviewer', 'Concept-level differences that rules cannot settle go to human review.'],
                ].map(([Icon, color, title, body]) => {
                  const I = Icon as typeof CircleX;
                  return (
                    <li key={title as string} className="flex gap-3.5">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] inset-ring inset-ring-white/10">
                        <I className={cn('size-4', color as string)} aria-hidden />
                      </span>
                      <span>
                        <span className="block text-[15px] font-medium">{title as string}</span>
                        <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">{body as string}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="relative">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { code: 'EN', lang: 'Nigerian English', note: 'Response', text: 'There is a ₦50 transfer fee, so the total deducted from your account is ', value: '₦5,050', bad: false },
                  { code: 'HA', lang: 'Hausa', note: 'English gloss of the response', text: 'With the ₦50 fee, the total taken from your account is ', value: '₦5,500', bad: true },
                ].map((r) => (
                  <figure key={r.code} className={cn('surface rounded-xl border p-5', r.bad ? 'border-red-400/25' : 'border-border')}>
                    <figcaption className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-300">
                        <span className="rounded-full bg-white/[0.07] px-1.5 py-0.5 font-mono text-[10px]">{r.code}</span> {r.lang}
                      </span>
                      {r.bad ? (
                        <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-red-300">
                          <CircleX className="size-3.5" aria-hidden /> Contradicted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-green-300">
                          <CircleCheck className="size-3.5" aria-hidden /> Supported
                        </span>
                      )}
                    </figcaption>
                    <div className="eyebrow mt-4">{r.note}</div>
                    <blockquote className="mt-1.5 text-[15px] leading-relaxed text-slate-200">
                      “{r.text}
                      <mark className={cn('rounded px-1 font-mono text-[14px]', r.bad ? 'bg-danger-soft text-red-200' : 'bg-success-soft text-green-200')}>{r.value}</mark>.”
                    </blockquote>
                  </figure>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-inset px-4 py-3 text-xs">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <Hash className="size-3.5 text-subtle-foreground" aria-hidden />
                  Reference fact <span className="font-mono text-slate-300">fact:total-deducted = 5050 NGN</span>
                </span>
                <span className="text-subtle-foreground">Illustrative example</span>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- features */}
        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="group relative bg-background p-7 transition-colors hover:bg-panel sm:p-8">
                <span className="flex size-10 items-center justify-center rounded-xl bg-[linear-gradient(180deg,rgb(139_92_246/0.2),rgb(139_92_246/0.05))] inset-ring inset-ring-violet-400/20">
                  <Icon className="size-[18px] text-violet-200" aria-hidden />
                </span>
                <h3 className="mt-5 text-[17px] font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------- how it works */}
        <section id="how" className="relative scroll-mt-20 overflow-hidden border-y border-white/[0.05] bg-panel/50">
          <ContourField preset="corner" className="opacity-70" />
          <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.025em] text-balance sm:text-[40px] sm:leading-[1.1]">
              From prompt to evidence in three steps.
            </h2>
            <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
              {STEPS.map((s) => (
                <li key={s.n} className="relative">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm text-violet-300">{s.n}</span>
                    <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" aria-hidden />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ------------------------------------------------------ developers */}
        <section id="developers" className="scroll-mt-20">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:py-32">
            <div>
              <Eyebrow>For developers</Eyebrow>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.025em] text-balance sm:text-[40px] sm:leading-[1.1]">
                Evaluations that run where your code runs.
              </h2>
              <p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">
                Every screen in the dashboard is backed by the same REST API. Create a project-scoped key, start runs from CI, wait for
                completion and fail the build when consistency regresses.
              </p>
              <ul className="mt-8 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                {['Typed TypeScript SDK', 'OpenAPI 3 specification', 'Project-scoped API keys', 'JSON, CSV & Markdown exports'].map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <CircleCheck className="size-4 text-violet-300" aria-hidden /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e1015] shadow-[0_30px_80px_-30px_rgb(0_0_0/0.8)]">
              <div className="flex items-center gap-3 border-b border-white/[0.07] bg-white/[0.02] px-4 py-2.5">
                <span className="flex gap-1.5" aria-hidden>
                  <span className="size-2.5 rounded-full bg-white/10" />
                  <span className="size-2.5 rounded-full bg-white/10" />
                  <span className="size-2.5 rounded-full bg-white/10" />
                </span>
                <span className="font-mono text-[11px] text-subtle-foreground">evaluate.ts</span>
              </div>
              <pre className="overflow-x-auto p-5 text-[12.5px] leading-[1.75] text-slate-300">
                <code>{SDK_SNIPPET}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- integrity */}
        <section id="integrity" className="scroll-mt-20 px-4 pb-24 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border-gradient p-8 sm:p-12">
            <ContourField preset="panel" className="opacity-80" />
            <div className="relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <Eyebrow>Integrity by design</Eyebrow>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.025em] text-balance sm:text-4xl">
                  Numbers you can <span className="font-serif font-normal italic text-brand">defend.</span>
                </h2>
                <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
                  An evaluation platform is only useful if its results are honest. These rules are enforced in code, not left to policy.
                </p>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {PRINCIPLES.map((p) => (
                  <li key={p} className="rounded-xl bg-white/[0.03] p-4 text-sm leading-relaxed text-slate-300 inset-ring inset-ring-white/[0.07]">
                    <ShieldCheck className="mb-3 size-4 text-green-300" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- cta */}
        <section className="relative isolate overflow-hidden border-t border-white/[0.05]">
          <GridBackdrop className="-z-10" />
          <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
            <GitCompareArrows className="mx-auto size-6 text-violet-300" aria-hidden />
            <h2 className="mt-6 text-3xl font-semibold tracking-[-0.025em] text-balance sm:text-[44px] sm:leading-[1.1]">
              Measure N-ATLaS before your users do.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">Create a project, run the Nigerian Context Benchmark and read the evidence in minutes.</p>
            <div className="mt-8 flex justify-center">
              <Button asChild size="lg">
                <Link href="/signup">
                  Create your account <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.05] bg-panel/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-3 text-xs leading-relaxed text-subtle-foreground">Multilingual evaluation and reliability infrastructure for Nigerian AI.</p>
          </div>
          <div className="flex max-w-md flex-col gap-2 text-xs leading-relaxed text-subtle-foreground">
            <p>{NATLAS_ATTRIBUTION}</p>
            <p>AtlasGuard is an independent open-source project and is not affiliated with Awarri Technologies or the Federal Ministry.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
