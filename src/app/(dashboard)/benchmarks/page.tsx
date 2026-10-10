'use client';

import { ArrowRight, BookOpen, Lock, Play, Search, ShieldCheck, Upload } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { CATEGORY_OPTIONS, FilterSelect, LANGUAGE_OPTIONS } from '@/components/app/filters';
import { EmptyState, ErrorState, LoadingRows, PageHeader } from '@/components/app/page';
import { Meter } from '@/components/app/viz';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form-controls';
import { useBenchmarks } from '@/lib/api/hooks';
import { categoryLabel, LANGUAGES } from '@/lib/constants';

export default function BenchmarksPage() {
  const [search, setSearch] = React.useState('');
  const [language, setLanguage] = React.useState<string>();
  const [category, setCategory] = React.useState<string>();
  const suites = useBenchmarks({ search: search || undefined, language, category });

  return (
    <>
      <PageHeader
        title="Benchmarks"
        description="Nigerian-context benchmark suites. Every case carries provenance and a review status; AI-drafted content stays pending until a fluent reviewer verifies it."
        actions={
          <Button asChild variant="secondary">
            <Link href="/benchmarks/import">
              <Upload /> Import dataset
            </Link>
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-3 left-3 size-4 text-subtle-foreground" aria-hidden />
          <Input placeholder="Search suites" aria-label="Search suites" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <FilterSelect label="Language" value={language} onChange={setLanguage} options={LANGUAGE_OPTIONS} />
        <FilterSelect label="Category" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} className="w-56" />
      </div>

      {suites.isLoading && <LoadingRows />}
      {suites.error && <ErrorState error={suites.error} onRetry={() => void suites.refetch()} />}
      {suites.data?.items.length === 0 && <EmptyState icon={BookOpen} title="No benchmark suites match" description="Try other filters, or import your own dataset." />}

      <div className="grid gap-4 lg:grid-cols-2">
        {suites.data?.items.map((s) => {
          const verified = s.stats.caseCount ? s.stats.verifiedCount / s.stats.caseCount : 0;
          const maxLang = Math.max(1, ...Object.values(s.stats.languages));
          return (
            <article key={s.id} className="surface flex flex-col rounded-xl border border-border p-6">
              <div className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(180deg,rgb(139_92_246/0.22),rgb(139_92_246/0.06))] inset-ring inset-ring-violet-400/25">
                  <BookOpen className="size-[18px] text-violet-200" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/benchmarks/${s.id}`} className="text-base font-semibold tracking-tight underline-offset-4 hover:underline">
                    {s.name}
                  </Link>
                  <div className="mt-0.5 truncate font-mono text-[11.5px] text-subtle-foreground">
                    {s.namespace}/{s.slug} · v{s.version}
                  </div>
                </div>
                {s.isOfficial ? (
                  <Badge variant="primary">
                    <ShieldCheck /> Official
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <Lock /> Private
                  </Badge>
                )}
              </div>
              {s.description && <p className="mt-4 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">{s.description}</p>}

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <div className="eyebrow mb-2.5">Cases by language</div>
                  <ul className="flex flex-col gap-1.5">
                    {LANGUAGES.filter((l) => s.stats.languages[l.code]).map((l) => (
                      <li key={l.code} className="grid grid-cols-[1.75rem_minmax(0,1fr)_1.75rem] items-center gap-2 text-xs">
                        <span className="font-mono text-[10.5px] text-slate-300">{l.short}</span>
                        <span className="h-1.5 rounded-full bg-white/[0.06]">
                          <span className="block h-full rounded-full bg-[#8b5cf6]" style={{ width: `${(s.stats.languages[l.code]! / maxLang) * 100}%` }} />
                        </span>
                        <span className="text-right text-muted-foreground tabular">{s.stats.languages[l.code]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col">
                  <div className="eyebrow mb-2.5">Human review</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-semibold">{s.stats.verifiedCount}</span>
                    <span className="text-xs text-muted-foreground">of {s.stats.caseCount} verified</span>
                  </div>
                  <Meter value={verified} label="Share of cases verified by a fluent reviewer" className="mt-2" />
                  <p className="mt-2 text-xs text-subtle-foreground">
                    {s.stats.unreviewedCount} case{s.stats.unreviewedCount === 1 ? '' : 's'} awaiting review · {s.stats.semanticGroupCount} semantic groups
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {Object.keys(s.stats.categories).map((c) => (
                  <Badge key={c} variant="neutral">
                    {categoryLabel(c)}
                  </Badge>
                ))}
              </div>

              <div className="mt-6 flex gap-2 border-t border-border pt-4">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/benchmarks/${s.id}`}>
                    Inspect cases <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="sm" className="ml-auto">
                  <Link href={`/evaluations/new?suiteId=${s.id}`}>
                    <Play /> Run
                  </Link>
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
