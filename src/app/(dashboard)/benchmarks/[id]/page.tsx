'use client';

import { ChevronDown, Download, Play, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';
import { FactList, ProvenanceList } from '@/components/app/facts';
import { CATEGORY_OPTIONS, FilterSelect, LANGUAGE_OPTIONS, Pagination, REVIEW_OPTIONS } from '@/components/app/filters';
import { EmptyState, ErrorState, LoadingRows, PageHeader, StatTile } from '@/components/app/page';
import { LanguageBadge, ReviewStatusBadge } from '@/components/app/status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox, Field, Input, Label, Textarea } from '@/components/ui/form-controls';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/overlays';
import { downloadFile, errorMessage } from '@/lib/api/client';
import { useBenchmark, useBenchmarkCases, useReviewCase } from '@/lib/api/hooks';
import type { BenchmarkCase } from '@/lib/api/types';
import { categoryLabel, languageName } from '@/lib/constants';
import { cn, formatDateTime } from '@/lib/utils';

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
          <label className="flex items-start gap-3 rounded-md border border-border bg-background-subtle p-3 text-sm">
            <Checkbox checked={attested} onCheckedChange={(v) => setAttested(v === true)} className="mt-0.5" />
            <span>
              I am fluent in <strong>{lang}</strong> and have checked that the prompt, its translation and the reference facts are
              correct and mean the same as the other language variants.
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

function CaseRow({ c, canManage, suiteId }: { c: BenchmarkCase; canManage: boolean; suiteId: string }) {
  const [open, setOpen] = React.useState(false);
  const [review, setReview] = React.useState<null | 'VERIFIED' | 'REJECTED' | 'PENDING_REVIEW'>(null);
  return (
    <li className="rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full cursor-pointer flex-wrap items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-card-hover"
      >
        <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{c.title}</div>
          <div className="font-mono text-xs text-subtle-foreground">{c.key}</div>
        </div>
        <LanguageBadge code={c.language} />
        <Badge variant="neutral" className="hidden sm:inline-flex">
          {categoryLabel(c.category)}
        </Badge>
        <Badge variant="outline" className="hidden md:inline-flex">
          {c.difficulty.toLowerCase()}
        </Badge>
        <ReviewStatusBadge status={c.reviewStatus} />
      </button>
      {open && (
        <div className="grid gap-5 border-t border-border p-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <section>
              <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">Prompt ({languageName(c.language)})</h4>
              <p lang={c.language === 'en-NG' ? 'en' : c.language} className="rounded-md border border-border bg-background-subtle p-3 text-sm leading-relaxed whitespace-pre-wrap">
                {c.prompt}
              </p>
            </section>
            <section>
              <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">Reference facts</h4>
              <FactList facts={c.facts} language={c.language} />
            </section>
            {(c.evaluationRules.length > 0 || c.requiredTerms.length > 0 || c.forbiddenTerms.length > 0) && (
              <section>
                <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">Instruction rules</h4>
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
              </section>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <section>
              <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">Provenance</h4>
              <ProvenanceList provenance={c.provenance} />
            </section>
            <section className="rounded-md border border-border bg-background-subtle p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm">
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
              {c.reviewNotes && <p className="mt-2 text-xs text-muted-foreground">“{c.reviewNotes}”</p>}
              {!canManage && (
                <p className="mt-2 text-xs text-subtle-foreground">
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

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/benchmarks" className="hover:text-foreground">
            Benchmarks
          </Link>
        }
        title={
          <span className="flex flex-wrap items-center gap-2">
            {s.name}
            <span className="font-mono text-sm font-normal text-subtle-foreground">v{s.version}</span>
            {s.isOfficial && (
              <Badge variant="primary">
                <ShieldCheck /> Official
              </Badge>
            )}
          </span>
        }
        description={s.description}
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Cases" value={s.stats.caseCount} />
        <StatTile label="Semantic groups" value={s.stats.semanticGroupCount} hint="Equivalent questions across languages" />
        <StatTile label="Verified cases" value={`${s.stats.verifiedCount}/${s.stats.caseCount}`} tone={s.stats.verifiedCount ? 'success' : 'warning'} />
        <StatTile label="Content hash" value={<span className="font-mono text-sm">{s.contentHash.slice(0, 12)}…</span>} hint="Recorded on every run" />
      </div>

      {s.stats.verifiedCount === 0 && (
        <p className="mt-4 rounded-md border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-amber-200">
          No case in this suite has been verified by a fluent reviewer yet. Prompts, translations and reference facts are
          AI-assisted drafts; results are useful for development but should be read with that limitation in mind.
        </p>
      )}

      <Tabs defaultValue="cases" className="mt-6">
        <TabsList>
          <TabsTrigger value="cases">Cases</TabsTrigger>
          <TabsTrigger value="groups">Semantic groups ({s.semanticGroups.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="cases">
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-subtle-foreground" aria-hidden />
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
          <div className="grid gap-3 md:grid-cols-2">
            {s.semanticGroups.map((g) => (
              <Card key={g.id}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{g.title}</div>
                      <div className="font-mono text-xs text-subtle-foreground">{g.key}</div>
                    </div>
                    <Badge variant="neutral">{categoryLabel(g.category)}</Badge>
                  </div>
                  {g.description && <p className="mt-2 text-sm text-muted-foreground">{g.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {g.languages.map((l) => (
                      <LanguageBadge key={l} code={l} />
                    ))}
                  </div>
                  <div className="mt-3">
                    <Label className="text-xs text-muted-foreground">Shared reference facts</Label>
                    <div className="mt-1.5">
                      <FactList facts={g.expectedFacts} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
