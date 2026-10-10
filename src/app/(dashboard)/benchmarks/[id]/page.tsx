'use client';

import { ChevronDown, Download, Hash, Play, Search, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';
import { Breadcrumbs } from '@/components/app/app-shell';
import { FactList, ProvenanceList } from '@/components/app/facts';
import { CATEGORY_OPTIONS, FilterSelect, LANGUAGE_OPTIONS, Pagination, REVIEW_OPTIONS } from '@/components/app/filters';
import { EmptyState, ErrorState, LoadingRows, MetaItem, PageHeader } from '@/components/app/page';
import { LanguageChip, ReviewStatusBadge } from '@/components/app/status';
import { Meter } from '@/components/app/viz';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox, Field, Input, Textarea } from '@/components/ui/form-controls';
import { CopyButton } from '@/components/ui/misc';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/overlays';
import { downloadFile, errorMessage } from '@/lib/api/client';
import { useBenchmark, useBenchmarkCases, useReviewCase } from '@/lib/api/hooks';
import type { BenchmarkCase, ContentReviewStatus } from '@/lib/api/types';
import { categoryLabel, LANGUAGES, languageName } from '@/lib/constants';
import { cn, formatDateTime } from '@/lib/utils';

const REVIEW_STRIPE: Record<ContentReviewStatus, string> = {
  VERIFIED: 'var(--color-success)',
  PENDING_REVIEW: 'var(--color-warning)',
  DRAFT: 'rgb(255 255 255 / 0.15)',
  REJECTED: 'var(--color-danger)',
};

function ReviewDialog({
  suiteId,
  benchmarkCase,
  status,
  onClose,
}: {
  suiteId: string;
  benchmarkCase: BenchmarkCase;
  status: 'VERIFIED' | 'REJECTED' | 'PENDING_REVIEW';
  onClose: () => void;
}) {
  const review = useReviewCase(suiteId);
  const [attested, setAttested] = React.useState(false);
  const [notes, setNotes] = React.useState('');
  const lang = languageName(benchmarkCase.language);
  const title = { VERIFIED: 'Verify case', REJECTED: 'Reject case', PENDING_REVIEW: 'Reset to pending review' }[status];
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            <span className="font-mono">{benchmarkCase.key}</span> — your name and the time are recorded with this decision.
          </DialogDescription>
        </DialogHeader>
        {status === 'VERIFIED' && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-inset p-3.5 text-sm leading-relaxed">
            <Checkbox checked={attested} onCheckedChange={(v) => setAttested(v === true)} className="mt-0.5" />
            <span>
              I am fluent in <strong>{lang}</strong> and have checked that the prompt, its translation and the reference facts are correct and mean the
              same as the other language variants.
            </span>
          </label>
        )}
        <Field label="Notes" htmlFor="review-notes" hint="Optional: what you checked or why you rejected it.">
          <Textarea id="review-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        {review.error ? <p className="text-sm text-red-300">{errorMessage(review.error)}</p> : null}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={status === 'REJECTED' ? 'destructive' : 'default'}
            disabled={status === 'VERIFIED' && !attested}
            loading={review.isPending}
            onClick={() =>
              review.mutate(
                { caseId: benchmarkCase.id, status, notes: notes || undefined, attestation: status === 'VERIFIED' ? attested : undefined },
                {
                  onSuccess: () => {
                    toast.success('Review recorded');
                    onClose();
                  },
                },
              )
            }
          >
            {title}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="mb-2 text-xs font-medium text-muted-foreground">{title}</h4>
      {children}
    </section>
  );
}

function CaseRow({ c, canManage, suiteId }: { c: BenchmarkCase; canManage: boolean; suiteId: string }) {
  const [open, setOpen] = React.useState(false);
  const [review, setReview] = React.useState<null | 'VERIFIED' | 'REJECTED' | 'PENDING_REVIEW'>(null);
  return (
    <li className={cn('relative overflow-hidden rounded-xl border bg-card transition-colors', open ? 'border-border-strong shadow-card' : 'border-border hover:border-white/12')}>
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: REVIEW_STRIPE[c.reviewStatus] }} />
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 py-3 pr-4 pl-5 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="min-w-[min(100%,13rem)] flex-1">
          <div className="truncate text-[13.5px] font-medium">{c.title}</div>
          <div className="mt-0.5 truncate font-mono text-xs text-subtle-foreground">{c.key}</div>
        </div>
        <LanguageChip code={c.language} />
        <Badge variant="neutral" className="hidden sm:inline-flex">
          {categoryLabel(c.category)}
        </Badge>
        <span className="hidden w-14 font-mono text-[11px] text-subtle-foreground md:inline">{c.difficulty.toLowerCase()}</span>
        <ReviewStatusBadge status={c.reviewStatus} />
        <ChevronDown className={cn('size-4 shrink-0 text-subtle-foreground transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="grid gap-6 border-t border-border bg-white/[0.012] p-5 animate-fade-in lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-5">
            <Section title={`Prompt (${languageName(c.language)})`}>
              <p lang={c.language === 'en-NG' ? 'en' : c.language} className="rounded-lg border border-border bg-inset p-3.5 text-[13.5px] leading-relaxed whitespace-pre-wrap text-slate-200">
                {c.prompt}
              </p>
            </Section>
            <Section title="Reference facts">
              <FactList facts={c.facts} language={c.language} />
            </Section>
            {(c.evaluationRules.length > 0 || c.requiredTerms.length > 0 || c.forbiddenTerms.length > 0) && (
              <Section title="Instruction rules">
                <div className="flex flex-wrap gap-1.5">
                  {c.evaluationRules.map((r, i) => (
                    <Badge key={i} variant="outline" className="font-mono">
                      {r.type}
                      {'value' in r ? `: ${String(r.value)}` : ''}
                      {'language' in r && r.language ? `: ${String(r.language)}` : ''}
                    </Badge>
                  ))}
                  {c.requiredTerms.length > 0 && <Badge variant="outline">required: {c.requiredTerms.join(', ')}</Badge>}
                  {c.forbiddenTerms.length > 0 && <Badge variant="outline">forbidden: {c.forbiddenTerms.join(', ')}</Badge>}
                </div>
              </Section>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-5">
            <Section title="Provenance">
              <div className="rounded-lg border border-border bg-inset p-3.5">
                <ProvenanceList provenance={c.provenance} />
              </div>
            </Section>
            <section className="rounded-xl border border-border bg-inset p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <ReviewStatusBadge status={c.reviewStatus} />
                  {c.reviewedBy && (
                    <span className="text-xs text-muted-foreground">
                      by {c.reviewedBy.name} · {formatDateTime(c.reviewedAt)}
                    </span>
                  )}
                </div>
                {canManage && (
                  <div className="flex flex-wrap gap-1.5">
                    {c.reviewStatus !== 'VERIFIED' && (
                      <Button size="sm" onClick={() => setReview('VERIFIED')}>
                        <ShieldCheck /> Verify
                      </Button>
                    )}
                    {c.reviewStatus !== 'REJECTED' && (
                      <Button size="sm" variant="secondary" onClick={() => setReview('REJECTED')}>
                        <ShieldAlert /> Reject
                      </Button>
                    )}
                    {c.reviewStatus !== 'PENDING_REVIEW' && (
                      <Button size="sm" variant="ghost" onClick={() => setReview('PENDING_REVIEW')}>
                        Reset
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {c.reviewNotes && <p className="mt-2.5 text-xs text-muted-foreground">“{c.reviewNotes}”</p>}
              {!canManage && (
                <p className="mt-2.5 text-xs leading-relaxed text-subtle-foreground">
                  Official content can only be reviewed by AtlasGuard administrators who are fluent in the language.
                </p>
              )}
            </section>
          </div>
        </div>
      )}
      {review && <ReviewDialog suiteId={suiteId} benchmarkCase={c} status={review} onClose={() => setReview(null)} />}
    </li>
  );
}

export default function BenchmarkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const suite = useBenchmark(id);
  const [language, setLanguage] = React.useState<string>();
  const [category, setCategory] = React.useState<string>();
  const [reviewStatus, setReviewStatus] = React.useState<string>();
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const cases = useBenchmarkCases(id, { language, category, reviewStatus, search: search || undefined, page, pageSize: 25 });
  const [exporting, setExporting] = React.useState(false);

  React.useEffect(() => setPage(1), [language, category, reviewStatus, search]);

  if (suite.isLoading) return <LoadingRows rows={5} />;
  if (suite.error || !suite.data) return <ErrorState error={suite.error} onRetry={() => void suite.refetch()} />;
  const s = suite.data;
  const verified = s.stats.caseCount ? s.stats.verifiedCount / s.stats.caseCount : 0;
  const languageCount = Object.keys(s.stats.languages).length;

  return (
    <>
      <Breadcrumbs items={[{ label: 'Benchmarks', href: '/benchmarks' }, { label: s.name }]} />
      <PageHeader
        eyebrow={
          <>
            <span>Benchmark suite</span>
            <span className="text-muted-foreground normal-case">
              {s.namespace}/{s.slug}
            </span>
          </>
        }
        title={s.name}
        description={s.description}
        meta={
          <>
            <span className="font-mono text-slate-300">v{s.version}</span>
            {s.isOfficial && (
              <Badge variant="primary">
                <ShieldCheck /> Official
              </Badge>
            )}
            <MetaItem icon={Hash}>
              <span className="font-mono">{s.contentHash.slice(0, 16)}…</span>
              <CopyButton value={s.contentHash} label="Copy hash" className="-my-1" />
            </MetaItem>
          </>
        }
        actions={
          <>
            <Button
              variant="secondary"
              loading={exporting}
              onClick={async () => {
                setExporting(true);
                try {
                  await downloadFile(`/benchmarks/${s.id}/export`, undefined, `${s.slug}.json`);
                } catch (e) {
                  toast.error(errorMessage(e));
                } finally {
                  setExporting(false);
                }
              }}
            >
              <Download /> Export JSON
            </Button>
            <Button asChild>
              <Link href={`/evaluations/new?suiteId=${s.id}`}>
                <Play /> Run this benchmark
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border shadow-card lg:grid-cols-4">
        <div className="bg-card px-5 py-4">
          <div className="eyebrow">Cases</div>
          <div className="mt-2 text-2xl leading-none font-semibold">{s.stats.caseCount}</div>
          <div className="mt-2 text-[11px] text-subtle-foreground">Across {languageCount} languages</div>
        </div>
        <div className="bg-card px-5 py-4">
          <div className="eyebrow">Semantic groups</div>
          <div className="mt-2 text-2xl leading-none font-semibold">{s.stats.semanticGroupCount}</div>
          <div className="mt-2 text-[11px] text-subtle-foreground">Equivalent questions across languages</div>
        </div>
        <div className="bg-card px-5 py-4">
          <div className="eyebrow">Verified by a fluent reviewer</div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl leading-none font-semibold">{s.stats.verifiedCount}</span>
            <span className="text-xs text-muted-foreground">/ {s.stats.caseCount}</span>
          </div>
          <Meter value={verified} label="Share of cases verified" className="mt-2.5" />
        </div>
        <div className="bg-card px-5 py-4">
          <div className="eyebrow">Languages</div>
          <div className="mt-2.5 flex flex-wrap gap-1">
            {LANGUAGES.filter((l) => s.stats.languages[l.code]).map((l) => (
              <LanguageChip key={l.code} code={l.code} count={s.stats.languages[l.code]} compact />
            ))}
          </div>
        </div>
      </div>

      {s.stats.verifiedCount === 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-warning-soft px-4 py-3 text-sm text-amber-100/90">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-300" aria-hidden />
          <p>
            No case in this suite has been verified by a fluent reviewer yet. Prompts, translations and reference facts are AI-assisted drafts; results are
            useful for development but should be read with that limitation in mind.
          </p>
        </div>
      )}

      <Tabs defaultValue="cases" className="mt-8">
        <TabsList>
          <TabsTrigger value="cases">
            Cases <span className="rounded-full bg-white/[0.07] px-1.5 py-px text-[11px] text-muted-foreground tabular">{s.stats.caseCount}</span>
          </TabsTrigger>
          <TabsTrigger value="groups">
            Semantic groups <span className="rounded-full bg-white/[0.07] px-1.5 py-px text-[11px] text-muted-foreground tabular">{s.semanticGroups.length}</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="cases">
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-3 left-3 size-4 text-subtle-foreground" aria-hidden />
              <Input placeholder="Search prompts and keys" aria-label="Search cases" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <FilterSelect label="Language" value={language} onChange={setLanguage} options={LANGUAGE_OPTIONS} />
            <FilterSelect label="Category" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} className="w-56" />
            <FilterSelect label="Review" value={reviewStatus} onChange={setReviewStatus} options={REVIEW_OPTIONS} />
          </div>
          {cases.isLoading && <LoadingRows />}
          {cases.error && <ErrorState error={cases.error} onRetry={() => void cases.refetch()} />}
          {cases.data && cases.data.items.length === 0 && <EmptyState icon={Search} title="No cases match these filters" />}
          <ul className={cn('flex flex-col gap-2', cases.isPlaceholderData && 'opacity-60')}>
            {cases.data?.items.map((c) => (
              <CaseRow key={c.id} c={c} canManage={s.canManage} suiteId={s.id} />
            ))}
          </ul>
          <Pagination meta={cases.data?.meta} onPage={setPage} />
        </TabsContent>
        <TabsContent value="groups">
          <div className="grid gap-4 md:grid-cols-2">
            {s.semanticGroups.map((g) => (
              <Card key={g.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium">{g.title}</div>
                    <div className="mt-0.5 truncate font-mono text-xs text-subtle-foreground">{g.key}</div>
                  </div>
                  <Badge variant="neutral">{categoryLabel(g.category)}</Badge>
                </div>
                {g.description && <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{g.description}</p>}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {LANGUAGES.filter((l) => g.languages.includes(l.code)).map((l) => (
                    <LanguageChip key={l.code} code={l.code} />
                  ))}
                </div>
                <div className="mt-4">
                  <div className="eyebrow mb-2">Shared reference facts</div>
                  <FactList facts={g.expectedFacts} />
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
