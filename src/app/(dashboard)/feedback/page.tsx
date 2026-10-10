'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheck, MessageSquare } from 'lucide-react';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { PageHeader } from '@/components/app/page';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox, Field, Input, Label, Textarea } from '@/components/ui/form-controls';
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
      <Card className="mx-auto mt-10 max-w-lg">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <CircleCheck className="size-8 text-success" />
          <h1 className="text-lg font-semibold">Thank you for testing AtlasGuard</h1>
          <p className="text-sm text-muted-foreground">Your feedback was recorded with your consent and will help us improve the platform.</p>
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
      <Card className="max-w-3xl">
        <CardContent className="pt-5">
          <form
            noValidate
            className="flex flex-col gap-5"
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
              <p role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-red-200">
                {errorMessage(submit.error)}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name or agreed identifier" htmlFor="fb-id" error={errors.testerIdentifier?.message}>
                <Input id="fb-id" aria-invalid={!!errors.testerIdentifier} {...form.register('testerIdentifier')} />
              </Field>
              <Field label="Developer background" htmlFor="fb-bg" hint="e.g. backend developer, ML researcher, student">
                <Input id="fb-bg" {...form.register('developerBackground')} />
              </Field>
            </div>

            <fieldset>
              <legend className="text-sm font-medium">Features you tested</legend>
              <Controller
                control={form.control}
                name="testedFeatures"
                render={({ field }) => (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {FEATURES.map((f) => (
                      <label key={f} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={field.value.includes(f)}
                          onCheckedChange={(v) => field.onChange(v === true ? [...field.value, f] : field.value.filter((x) => x !== f))}
                        />
                        {f}
                      </label>
                    ))}
                  </div>
                )}
              />
              {errors.testedFeatures && <p className="mt-1 text-xs text-red-300">{errors.testedFeatures.message}</p>}
            </fieldset>

            <fieldset>
              <legend className="text-sm font-medium">Ease of use</legend>
              <Controller
                control={form.control}
                name="easeOfUseRating"
                render={({ field }) => (
                  <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Ease of use from 1 (hard) to 5 (easy)">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={field.value === n}
                        onClick={() => field.onChange(n)}
                        className={cn(
                          'size-9 cursor-pointer rounded-md border text-sm transition-colors',
                          field.value === n ? 'border-primary bg-primary-soft text-foreground' : 'border-border text-muted-foreground hover:bg-card-hover',
                        )}
                      >
                        {n}
                      </button>
                    ))}
                    <span className="self-center text-xs text-subtle-foreground">1 = hard · 5 = easy</span>
                  </div>
                )}
              />
            </fieldset>

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

            <Controller
              control={form.control}
              name="consentRecorded"
              render={({ field }) => (
                <div className="rounded-md border border-border bg-background-subtle p-3">
                  <label className="flex items-start gap-3 text-sm">
                    <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} className="mt-0.5" />
                    <span>
                      I consent to the AtlasGuard team using this feedback, with the identifier above, as evidence of real-world testing
                      in the National AI Innovation Challenge submission.
                    </span>
                  </label>
                  {errors.consentRecorded && <p className="mt-1 text-xs text-red-300">{errors.consentRecorded.message}</p>}
                </div>
              )}
            />
            <Label className="sr-only">Submit</Label>
            <Button type="submit" loading={submit.isPending} className="self-start">
              <MessageSquare /> Submit feedback
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
