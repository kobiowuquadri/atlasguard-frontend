import {
  ArrowRight,
  BookOpen,
  Code2,
  FileText,
  FlaskConical,
  GitCompareArrows,
  Languages,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/app/logo';
import { Button } from '@/components/ui/button';
import { NATLAS_ATTRIBUTION } from '@/lib/constants';

const FEATURES = [
  {
    icon: FlaskConical,
    title: 'Multilingual evaluation engine',
    body: 'Run benchmark suites against N-ATLaS and record the actual response, latency and every check: validity, language compliance, reference facts and instructions.',
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

const PRINCIPLES = [
  'Simulated fixtures are always labelled and can never be exported as N-ATLaS evidence.',
  'Technical errors are never counted as model failures.',
  'Uncertain automated judgements go to human review instead of becoming passes.',
  'AI-drafted translations stay “pending review” until a fluent speaker verifies them.',
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2" aria-label="Account">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Get started</Link>
          </Button>
        </nav>
      </header>

      <main id="main">
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.22),transparent_65%)]"
          />
          <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-violet-300" /> Developer infrastructure for N-ATLaS
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Engineering Trust in Nigerian AI.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              AtlasGuard makes N-ATLaS measurable. Benchmark Yoruba, Hausa, Igbo and Nigerian English responses, catch answers
              that change meaning between languages, and keep every result reproducible.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/signup">
                  Start evaluating <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary-soft to-transparent p-6 sm:p-8">
            <div className="flex items-center gap-2 text-sm font-medium text-violet-200">
              <GitCompareArrows className="size-4" /> Signature capability
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Cross-language consistency detection</h2>
            <p className="mt-3 max-w-3xl text-muted-foreground">
              Ask the same question in four languages and AtlasGuard checks each answer against shared reference facts. It
              separates confirmed contradictions (₦5,050 in English, ₦5,500 in Hausa) from omissions and from findings that need
              a fluent reviewer — and shows the responses side by side.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              {[
                ['Nigerian English', 'Supported'],
                ['Yoruba', 'Supported'],
                ['Hausa', 'Contradiction'],
                ['Igbo', 'Needs review'],
              ].map(([lang, state]) => (
                <div key={lang} className="rounded-lg border border-border bg-card p-3">
                  <div className="text-xs text-muted-foreground">{lang}</div>
                  <div className="mt-1 text-sm font-medium">{state}</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-subtle-foreground">Illustration of possible outcomes — not model results.</p>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-16 sm:grid-cols-2 sm:px-6">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-lg border border-border bg-card p-5">
              <Icon className="size-5 text-violet-300" aria-hidden />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="rounded-lg border border-border bg-background-subtle p-6">
            <div className="flex items-center gap-2 font-semibold">
              <Languages className="size-4 text-cyan-300" aria-hidden /> Integrity by design
            </div>
            <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {PRINCIPLES.map((p) => (
                <li key={p} className="flex gap-2">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> {p}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-subtle-foreground sm:px-6">
          <p>{NATLAS_ATTRIBUTION}</p>
          <p>AtlasGuard is an independent open-source project and is not affiliated with Awarri Technologies or the Federal Ministry.</p>
        </div>
      </footer>
    </div>
  );
}
