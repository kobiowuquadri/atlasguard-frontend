'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, CircleCheck, Lock, MessageSquare, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { PageHeader } from '@/components/app/page';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox, Field, Input, Textarea } from '@/components/ui/form-controls';
import { errorMessage } from '@/lib/api/client';
import { useSubmitFeedback } from '@/lib/api/hooks';
import { cn } from '@/lib/utils';

const FEATURES = [
  'Account & projects',
  'Benchmark browsing',
  'Running an evaluation',
  'Evaluation results',
  'Cross-language comparison',
  'Language insights',
  'Reports & exports',
  'API / SDK',
];

const RATING_LABELS = ['Very hard', 'Hard', 'Okay', 'Easy', 'Very easy'];

const schema = z.object({
  testerIdentifier: z.string().trim().min(2, 'Enter your name or an agreed pseudonym').max(100),
  developerBackground: z.string().trim().max(300).optional(),
  testedFeatures: z.array(z.string()).min(1, 'Select at least one feature you tried'),
  easeOfUseRating: z.number().int().min(1).max(5).optional(),
  mostUsefulFeature: z.string().trim().max(500).optional(),
  problemsEncountered: z.string().trim().max(4000).optional(),
  suggestions: z.string().trim().max(4000).optional(),
  overallAssessment: z.string().trim().min(5, 'Please write a short overall assessment').max(4000),
  consentRecorded: z.boolean().refine((v) => v, 'Consent is required to submit feedback'),
});
type Values = z.infer<typeof schema>;

function Group({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-border pt-6 first:border-t-0 first:pt-0 md:grid-cols-[12rem_minmax(0,1fr)] md:gap-8">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
    </section>
  );
}

export default function FeedbackPage() {
  const submit = useSubmitFeedback();
  const [done, setDone] = React.useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { testerIdentifier: '', testedFeatures: [], overallAssessment: '', consentRecorded: false },
  });
  const { errors } = form.formState;

  if (done) {
    return (
      <Card variant="featured" className="mx-auto mt-10 max-w-lg">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-success-soft inset-ring inset-ring-green-400/25">
            <CircleCheck className="size-6 text-green-300" />
          </span>
          <h1 className="mt-2 text-lg font-semibold">Thank you for testing AtlasGuard</h1>
          <p className="max-w-sm text-sm text-muted-foreground">Your feedback was recorded with your consent and will help us improve the platform.</p>
          <Button asChild variant="secondary" className="mt-3">
            <Link href="/overview">Back to overview</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title="Beta feedback"
        description="Tell us how AtlasGuard worked for you. We only collect what is below; please don’t include passwords or API keys."
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <Card>
          <CardContent className="pt-6">
            <form
              noValidate
              className="flex flex-col gap-6"
              onSubmit={form.handleSubmit((values) =>
                submit.mutate(
                  {
                    ...values,
                    developerBackground: values.developerBackground || undefined,
                    mostUsefulFeature: values.mostUsefulFeature || undefined,
                    problemsEncountered: values.problemsEncountered || undefined,
                    suggestions: values.suggestions || undefined,
                  },
                  { onSuccess: () => setDone(true) },
                ),
              )}
            >
              {submit.error && (
                <p role="alert" className="rounded-lg border border-red-400/20 bg-danger-soft px-3 py-2 text-sm text-red-200">
                  {errorMessage(submit.error)}
                </p>
              )}

              <Group title="About you" description="Use your name or a pseudonym you have agreed with the team.">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name or agreed identifier" htmlFor="fb-id" error={errors.testerIdentifier?.message}>
                    <Input id="fb-id" aria-invalid={!!errors.testerIdentifier} {...form.register('testerIdentifier')} />
                  </Field>
                  <Field label="Developer background" htmlFor="fb-bg" hint="e.g. backend developer, ML researcher, student">
                    <Input id="fb-bg" {...form.register('developerBackground')} />
                  </Field>
                </div>
              </Group>

              <Group title="What you tried" description="Select every area you used.">
                <fieldset>
                  <legend className="sr-only">Features you tested</legend>
                  <Controller
                    control={form.control}
                    name="testedFeatures"
                    render={({ field }) => (
                      <div className="flex flex-wrap gap-2">
                        {FEATURES.map((f) => {
                          const on = field.value.includes(f);
                          return (
                            <label
                              key={f}
                              className={cn(
                                'inline-flex h-8 cursor-pointer items-center gap-2 rounded-full pr-3 pl-2 text-[13px] transition-colors inset-ring has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet-400',
                                on ? 'bg-primary-soft text-violet-100 inset-ring-violet-400/40' : 'text-muted-foreground inset-ring-white/10 hover:text-foreground',
                              )}
                            >
                              <Checkbox
                                checked={on}
                                onCheckedChange={(v) => field.onChange(v === true ? [...field.value, f] : field.value.filter((x) => x !== f))}
                                className="size-4 rounded-full"
                              />
                              {f}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  />
                  {errors.testedFeatures && <p className="mt-2 text-xs text-red-300">{errors.testedFeatures.message}</p>}
                </fieldset>

                <fieldset>
                  <legend className="text-[13px] font-medium text-slate-200">Ease of use</legend>
                  <Controller
                    control={form.control}
                    name="easeOfUseRating"
                    render={({ field }) => (
                      <div className="mt-2 grid max-w-md grid-cols-5 gap-1 rounded-xl bg-white/[0.03] p-1 inset-ring inset-ring-white/[0.07]" role="radiogroup" aria-label="Ease of use from 1 (hard) to 5 (easy)">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            role="radio"
                            aria-checked={field.value === n}
                            onClick={() => field.onChange(n)}
                            className={cn(
                              'flex cursor-pointer flex-col items-center gap-0.5 rounded-lg py-2 transition-colors',
                              field.value === n ? 'bg-primary text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]' : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground',
                            )}
                          >
                            <span className="text-sm font-semibold">{n}</span>
                            <span className={cn('text-[10px]', field.value === n ? 'text-violet-100' : 'text-subtle-foreground')}>{RATING_LABELS[n - 1]}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </fieldset>
              </Group>

              <Group title="Your experience" description="Specifics help most: screens, runs, error messages.">
                <Field label="Most useful feature" htmlFor="fb-useful">
                  <Input id="fb-useful" {...form.register('mostUsefulFeature')} />
                </Field>
                <Field label="Problems encountered" htmlFor="fb-problems" hint="Bugs, confusing screens, wrong results — anything.">
                  <Textarea id="fb-problems" rows={4} {...form.register('problemsEncountered')} />
                </Field>
                <Field label="Suggestions" htmlFor="fb-suggestions">
                  <Textarea id="fb-suggestions" rows={3} {...form.register('suggestions')} />
                </Field>
                <Field label="Overall assessment" htmlFor="fb-overall" error={errors.overallAssessment?.message}>
                  <Textarea id="fb-overall" rows={3} aria-invalid={!!errors.overallAssessment} {...form.register('overallAssessment')} />
                </Field>
              </Group>

              <Group title="Consent">
                <Controller
                  control={form.control}
                  name="consentRecorded"
                  render={({ field }) => (
                    <div className="rounded-xl border border-border bg-inset p-4">
                      <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed">
                        <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} className="mt-0.5" />
                        <span>
                          I consent to the AtlasGuard team using this feedback, with the identifier above, as evidence of real-world testing in the National AI
                          Innovation Challenge submission.
                        </span>
                      </label>
                      {errors.consentRecorded && <p className="mt-2 text-xs text-red-300">{errors.consentRecorded.message}</p>}
                    </div>
                  )}
                />
                <Button type="submit" loading={submit.isPending} className="self-start">
                  <MessageSquare /> Submit feedback
                </Button>
              </Group>
            </form>
          </CardContent>
        </Card>

        <aside className="flex flex-col gap-3 self-start xl:sticky xl:top-20">
          {[
            { icon: ShieldCheck, title: 'Used only with consent', body: 'Nothing is stored unless you tick the consent box.' },
            { icon: Lock, title: 'No secrets, please', body: 'Never paste passwords, API keys or private data into the form.' },
            { icon: Check, title: 'Stored as you wrote it', body: 'Submissions are kept verbatim with your identifier; administrators can export consented feedback.' },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl bg-white/[0.025] p-4 inset-ring inset-ring-white/[0.07]">
              <Icon className="size-4 text-violet-300" aria-hidden />
              <div className="mt-2.5 text-[13px] font-medium">{title}</div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}
