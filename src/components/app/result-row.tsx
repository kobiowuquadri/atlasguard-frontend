'use client';

import { ChevronDown, CircleCheck, CircleX, UserCheck } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { FactList } from '@/components/app/facts';
import { CheckStatusLabel, LanguageChip, VERDICT_COLORS, VerdictBadge } from '@/components/app/status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/form-controls';
import { errorMessage } from '@/lib/api/client';
import { useReviewResult, useRunResult } from '@/lib/api/hooks';
import type { EvaluationResult } from '@/lib/api/types';
import { categoryLabel, languageName } from '@/lib/constants';
import { cn, formatDateTime, formatMs } from '@/lib/utils';

const langAttr = (code: string) => (code === 'en-NG' ? 'en' : code);

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-xs font-medium text-muted-foreground">{title}</h4>
        {aside}
      </div>
      {children}
    </section>
  );
}

function ReviewPanel({ runId, result }: { runId: string; result: EvaluationResult }) {
  const detail = useRunResult(runId, result.id);
  const review = useReviewResult(runId);
  const [notes, setNotes] = React.useState('');
  const reviewable = result.executionStatus === 'DONE' && result.verdict && !['ERROR', 'SKIPPED'].includes(result.verdict);

  return (
    <div className="rounded-xl border border-border bg-inset p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="flex size-6 items-center justify-center rounded-md bg-primary-soft inset-ring inset-ring-violet-400/25">
          <UserCheck className="size-3.5 text-violet-200" aria-hidden />
        </span>
        Human review
      </div>
      {!reviewable ? (
        <p className="mt-2 text-xs text-muted-foreground">Technical errors and skipped cases have no model response to judge.</p>
      ) : (
        <>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Automated verdict: <strong className="text-foreground">{result.verdict}</strong>. Your decision becomes the final verdict and is recorded with
            your name.
          </p>
          <Field label="Notes" htmlFor={`notes-${result.id}`} className="mt-3">
            <Textarea id={`notes-${result.id}`} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What did you check?" className="min-h-16" />
          </Field>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['PASSED', 'FAILED'] as const).map((decision) => (
              <Button
                key={decision}
                size="sm"
                variant={decision === 'PASSED' ? 'secondary' : 'outline'}
                loading={review.isPending && review.variables?.decision === decision}
                onClick={() =>
                  review.mutate(
                    { resultId: result.id, decision, notes: notes || undefined },
                    {
                      onSuccess: () => {
                        toast.success(`Marked as ${decision === 'PASSED' ? 'passed' : 'failed'}`);
                        setNotes('');
                      },
                      onError: (e) => toast.error(errorMessage(e)),
                    },
                  )
                }
              >
                {decision === 'PASSED' ? <CircleCheck className="text-success" /> : <CircleX className="text-danger" />}
                Mark {decision === 'PASSED' ? 'passed' : 'failed'}
              </Button>
            ))}
          </div>
        </>
      )}
      {detail.data && detail.data.reviews.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          {detail.data.reviews.map((r) => (
            <li key={r.id}>
              <strong className="text-foreground">{r.reviewer.name}</strong> marked {r.decision.toLowerCase()} (was {r.previousVerdict ?? '—'}) ·{' '}
              {formatDateTime(r.reviewedAt)}
              {r.notes && <span className="mt-0.5 block text-subtle-foreground">“{r.notes}”</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ResultRow({ result, runId }: { result: EvaluationResult; runId: string }) {
  const [open, setOpen] = React.useState(false);
  const checks = result.checks ?? [];
  const failing = checks.filter((c) => c.status === 'fail');
  const review = checks.filter((c) => c.status === 'uncertain');
  const reviewed = (result._count?.reviews ?? 0) > 0;
  const meta = result.responseMetadata;
  const usage = meta?.usage;
  const verdict = result.executionStatus === 'DONE' ? result.finalVerdict : null;

  return (
    <li className={cn('relative overflow-hidden rounded-xl border bg-card transition-colors', open ? 'border-border-strong shadow-card' : 'border-border hover:border-white/12')}>
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: verdict ? VERDICT_COLORS[verdict] : 'rgb(255 255 255 / 0.12)' }} />
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 py-3 pr-4 pl-5 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="min-w-[min(100%,13rem)] flex-1">
          <div className="truncate text-[13.5px] font-medium">{result.caseSnapshot.title}</div>
          <div className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-subtle-foreground">
            <span className="truncate font-mono">{result.caseKey}</span>
            <span className="hidden shrink-0 lg:inline">· {categoryLabel(result.category)}</span>
          </div>
        </div>
        <LanguageChip code={result.language} />
        <span className="hidden w-16 text-right font-mono text-xs text-subtle-foreground sm:block">{formatMs(result.responseTimeMs)}</span>
        {(failing.length > 0 || review.length > 0) && (
          <span className="hidden text-xs md:inline">
            {failing.length > 0 && <span className="text-red-300">{failing.length} failed</span>}
            {failing.length > 0 && review.length > 0 && <span className="text-subtle-foreground"> · </span>}
            {review.length > 0 && <span className="text-amber-200">{review.length} to review</span>}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          {reviewed && (
            <Badge variant="primary" title="Human-reviewed">
              <UserCheck /> Reviewed
            </Badge>
          )}
          <VerdictBadge verdict={verdict} />
        </span>
        <ChevronDown className={cn('size-4 shrink-0 text-subtle-foreground transition-transform', open && 'rotate-180')} aria-hidden />
      </button>

      {open && (
        <div className="grid gap-6 border-t border-border bg-white/[0.012] p-5 animate-fade-in lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-5">
            <Section title={`Prompt sent to the model (${languageName(result.language)})`}>
              <p lang={langAttr(result.language)} className="rounded-lg border border-border bg-inset p-3.5 text-[13.5px] leading-relaxed whitespace-pre-wrap text-slate-200">
                {result.prompt}
              </p>
            </Section>
            <Section title="Model response">
              {result.response !== null ? (
                <p
                  lang={langAttr(result.language)}
                  className="rounded-lg border border-border bg-inset p-3.5 text-[13.5px] leading-relaxed whitespace-pre-wrap text-slate-200 shadow-[inset_3px_0_0_rgb(139_92_246/0.5)]"
                >
                  {result.response || <span className="text-subtle-foreground italic">(empty response)</span>}
                </p>
              ) : result.errorDetails ? (
                <div className="rounded-lg border border-border bg-neutral-soft p-3.5 text-sm">
                  <span className="font-mono text-xs text-slate-300">{result.errorDetails.code}</span>
                  <p className="mt-1 text-muted-foreground">{result.errorDetails.message}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not executed yet.</p>
              )}
              {meta?.simulated && <p className="mt-2 text-xs text-amber-200">Simulated fixture response — not N-ATLaS output.</p>}
            </Section>
            <Section title="Reference facts">
              <FactList facts={result.caseSnapshot.facts} language={result.language} />
            </Section>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <Section title="Evaluation findings">
              {checks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No checks ran for this case.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-inset">
                  {checks.map((c) => (
                    <li key={c.id} className="px-3.5 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs text-slate-300">{c.id}</span>
                        <CheckStatusLabel status={c.status} />
                      </div>
                      <p className="mt-1.5 text-[13px] leading-relaxed">{c.explanation}</p>
                      {c.evidence && (
                        <p className="mt-1.5 border-l-2 border-border-strong pl-2.5 text-xs text-muted-foreground" lang={langAttr(result.language)}>
                          {c.evidence}
                        </p>
                      )}
                      <p className="mt-1.5 font-mono text-[10.5px] text-subtle-foreground">method: {c.method}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title="Timing & provenance">
              <dl className="grid grid-cols-[9.5rem_1fr] gap-x-3 gap-y-1.5 rounded-lg border border-border bg-inset p-3.5 text-xs">
                <dt className="text-muted-foreground">Round-trip latency</dt>
                <dd className="font-mono">{formatMs(result.responseTimeMs)}</dd>
                <dt className="text-muted-foreground">Provider generation</dt>
                <dd className="font-mono">{formatMs(result.providerInferenceMs)}</dd>
                <dt className="text-muted-foreground">Tokens (prompt / output)</dt>
                <dd className="font-mono">{usage ? `${usage.promptTokens ?? '—'} / ${usage.completionTokens ?? '—'}` : '—'}</dd>
                <dt className="text-muted-foreground">Served model</dt>
                <dd className="font-mono break-all">{meta?.servedModel ?? '—'}</dd>
                <dt className="text-muted-foreground">Finish reason</dt>
                <dd className="font-mono">{meta?.finishReason ?? '—'}</dd>
                <dt className="text-muted-foreground">Request id</dt>
                <dd className="font-mono break-all">{result.requestId ?? '—'}</dd>
                <dt className="text-muted-foreground">Executed</dt>
                <dd>{formatDateTime(result.executedAt)}</dd>
                <dt className="text-muted-foreground">Case revision</dt>
                <dd>
                  r{result.caseSnapshot.revision} · {result.caseSnapshot.reviewStatus.toLowerCase().replace('_', ' ')}
                </dd>
              </dl>
            </Section>

            {result.languageDetection && (
              <Section title="Language identification">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Detected <strong className="text-foreground">{languageName(result.languageDetection.detected)}</strong> (confidence{' '}
                  {result.languageDetection.confidence}, {result.languageDetection.wordCount} words
                  {result.languageDetection.codeSwitching ? ', code-switching' : ''}) ·{' '}
                  {Object.entries(result.languageDetection.shares)
                    .map(([k, v]) => `${k} ${Math.round(v * 100)}%`)
                    .join(' · ')}
                </p>
              </Section>
            )}

            <ReviewPanel runId={runId} result={result} />
          </div>
        </div>
      )}
    </li>
  );
}
