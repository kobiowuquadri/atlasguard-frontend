'use client';

import { BookOpen, Lock, Play, Search, ShieldCheck, Upload } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { CATEGORY_OPTIONS, FilterSelect, LANGUAGE_OPTIONS } from '@/components/app/filters';
import { EmptyState, ErrorState, LoadingRows, PageHeader } from '@/components/app/page';
import { LanguageBadge } from '@/components/app/status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/form-controls';
import { useBenchmarks } from '@/lib/api/hooks';
import { categoryLabel } from '@/lib/constants';

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
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-subtle-foreground" aria-hidden />
          <Input placeholder="Search suites" aria-label="Search suites" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <FilterSelect label="Language" value={language} onChange={setLanguage} options={LANGUAGE_OPTIONS} />
        <FilterSelect label="Category" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} className="w-56" />
      </div>

      {suites.isLoading && <LoadingRows />}
      {suites.error && <ErrorState error={suites.error} onRetry={() => void suites.refetch()} />}
      {suites.data?.items.length === 0 && (
        <EmptyState icon={BookOpen} title="No benchmark suites match" description="Try other filters, or import your own dataset." />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {suites.data?.items.map((s) => {
          const verifiedPct = s.stats.caseCount ? (s.stats.verifiedCount / s.stats.caseCount) * 100 : 0;
          return (
            <Card key={s.id} className="flex flex-col p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link href={`/benchmarks/${s.id}`} className="text-base font-semibold hover:underline underline-offset-4">
                    {s.name}
                  </Link>
                  <div className="mt-0.5 font-mono text-xs text-subtle-foreground">
                    {s.slug} · v{s.version}
                  </div>
                </div>
                <div className="flex gap-1.5">
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
              </div>
              {s.description && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{s.description}</p>}

              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Cases</dt>
                  <dd className="font-semibold tabular">{s.stats.caseCount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Semantic groups</dt>
                  <dd className="font-semibold tabular">{s.stats.semanticGroupCount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Verified</dt>
                  <dd className="font-semibold tabular">
                    {s.stats.verifiedCount}/{s.stats.caseCount}
                  </dd>
                </div>
              </dl>
              <div className="mt-2 h-1.5 rounded-full bg-elevated" aria-hidden>
                <div className="h-full rounded-full bg-success" style={{ width: `${verifiedPct}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {s.stats.unreviewedCount} case{s.stats.unreviewedCount === 1 ? '' : 's'} awaiting human review
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {Object.entries(s.stats.languages).map(([code, n]) => (
                  <LanguageBadge key={code} code={code} count={n} />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.keys(s.stats.categories).map((c) => (
                  <Badge key={c} variant="neutral">
                    {categoryLabel(c)}
                  </Badge>
                ))}
              </div>

              <div className="mt-5 flex gap-2 pt-1">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/benchmarks/${s.id}`}>
                    <BookOpen /> Inspect cases
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href={`/evaluations/new?suiteId=${s.id}`}>
                    <Play /> Run
                  </Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
