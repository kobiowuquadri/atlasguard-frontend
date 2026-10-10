'use client';

import { CircleCheck, FileJson, TriangleAlert, Upload } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';
import { Breadcrumbs } from '@/components/app/app-shell';
import { PageHeader } from '@/components/app/page';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox, Label, Textarea } from '@/components/ui/form-controls';
import { ApiError, errorMessage } from '@/lib/api/client';
import { useImportBenchmark, useMe } from '@/lib/api/hooks';
import type { ImportResult } from '@/lib/api/types';
import { cn } from '@/lib/utils';

const MAX_BYTES = 2 * 1024 * 1024;

function StepDot({ n, state }: { n: number; state: 'todo' | 'active' | 'done' }) {
  return (
    <span
      className={cn(
        'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
        state === 'done' ? 'bg-primary text-white' : state === 'active' ? 'bg-primary-soft text-violet-200 inset-ring inset-ring-violet-400/40' : 'bg-white/[0.05] text-subtle-foreground',
      )}
      aria-hidden
    >
      {state === 'done' ? <CircleCheck className="size-3.5" /> : n}
    </span>
  );
}

export default function ImportBenchmarkPage() {
  const me = useMe();
  const importer = useImportBenchmark();
  const [text, setText] = React.useState('');
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [official, setOfficial] = React.useState(false);
  const [validated, setValidated] = React.useState<ImportResult | null>(null);
  const [saved, setSaved] = React.useState<ImportResult | null>(null);
  const isAdmin = me.data?.user.role === 'ADMIN';

  const loadFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setParseError('File is larger than 2 MB.');
      return;
    }
    setText(await file.text());
    setFileName(file.name);
    setParseError(null);
    setValidated(null);
    setSaved(null);
  };

  const parse = (): unknown | null => {
    try {
      setParseError(null);
      return JSON.parse(text);
    } catch (e) {
      setParseError(`Not valid JSON: ${(e as Error).message}`);
      return null;
    }
  };

  const run = (dryRun: boolean) => {
    const dataset = parse();
    if (dataset === null) return;
    importer.mutate(
      { dataset, dryRun, official: isAdmin ? official : undefined },
      {
        onSuccess: (result) => {
          if (dryRun) setValidated(result);
          else {
            setSaved(result);
            toast.success('Benchmark imported');
          }
        },
      },
    );
  };

  const details = importer.error instanceof ApiError && Array.isArray(importer.error.details) ? (importer.error.details as Array<{ path: string; message: string }>) : [];

  return (
    <>
      <Breadcrumbs items={[{ label: 'Benchmarks', href: '/benchmarks' }, { label: 'Import' }]} />
      <PageHeader
        eyebrow="Benchmarks"
        title="Import a benchmark dataset"
        description="Upload or paste a dataset in the AtlasGuard benchmark format (formatVersion 1). Validate first; nothing is saved until you import."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardContent className="flex flex-col gap-4 pt-5">
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                void loadFile(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                'relative flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed px-6 py-8 text-center transition-colors',
                dragging ? 'border-violet-400/70 bg-primary-soft' : 'border-border-strong hover:border-white/20 hover:bg-white/[0.02]',
              )}
            >
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-dot-grid opacity-50 mask-radial" />
              <span className="relative flex size-10 items-center justify-center rounded-xl bg-white/[0.05] inset-ring inset-ring-white/10">
                <Upload className="size-[18px] text-violet-200" aria-hidden />
              </span>
              <span className="relative text-sm font-medium">{fileName ?? 'Drop a JSON file here, or choose one'}</span>
              <span className="relative text-xs text-muted-foreground">{fileName ? 'Choose another file to replace it' : 'Or paste the dataset below · max 2 MB'}</span>
              <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => void loadFile(e.target.files?.[0])} />
            </label>
            <div>
              <Label htmlFor="dataset-json" className="sr-only">
                Dataset JSON
              </Label>
              <Textarea
                id="dataset-json"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setFileName(null);
                  setValidated(null);
                  setSaved(null);
                }}
                rows={16}
                spellCheck={false}
                className="font-mono text-xs leading-relaxed"
                placeholder='{ "formatVersion": 1, "suite": { "slug": "my-suite", "name": "My suite", "version": "1.0.0" }, "semanticGroups": [ … ] }'
              />
            </div>
            {isAdmin && (
              <label className="flex items-center gap-2.5 text-[13px]">
                <Checkbox checked={official} onCheckedChange={(v) => setOfficial(v === true)} /> Import as an official AtlasGuard suite
              </label>
            )}
            {parseError && <p className="text-sm text-red-300">{parseError}</p>}
            {importer.error && (
              <div role="alert" className="rounded-xl border border-red-400/20 bg-danger-soft p-4 text-sm">
                <p className="font-medium text-red-200">{errorMessage(importer.error)}</p>
                {details.length > 0 && (
                  <ul className="mt-2 max-h-60 overflow-y-auto font-mono text-xs text-red-200/90">
                    {details.map((d, i) => (
                      <li key={i}>
                        {d.path}: {d.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => run(true)} disabled={!text.trim()} loading={importer.isPending && !validated}>
                <FileJson /> Validate
              </Button>
              <Button onClick={() => run(false)} disabled={!validated || !!saved} loading={importer.isPending && !!validated}>
                <Upload /> Import suite
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardHeader>
            <CardTitle>Validation</CardTitle>
            <CardDescription>Two steps: check the structure, then save.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <ol className="flex flex-col gap-3">
              <li className="flex items-center gap-3">
                <StepDot n={1} state={validated ? 'done' : text.trim() ? 'active' : 'todo'} />
                <span className={validated ? 'text-foreground' : 'text-muted-foreground'}>Validate the dataset</span>
              </li>
              <li className="flex items-center gap-3">
                <StepDot n={2} state={saved ? 'done' : validated ? 'active' : 'todo'} />
                <span className={saved ? 'text-foreground' : 'text-muted-foreground'}>Import the suite</span>
              </li>
            </ol>
            {!validated && !saved && <p className="text-[13px] text-muted-foreground">Validate the dataset to see its structure and quality warnings.</p>}
            {validated && (
              <div className="rounded-xl border border-border bg-inset p-4">
                <p className="flex items-center gap-2 font-medium text-green-300">
                  <CircleCheck className="size-4" aria-hidden /> Valid dataset
                </p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {validated.counts.semanticGroups} semantic groups · {validated.counts.cases} cases
                </p>
                {validated.warnings.length > 0 && (
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="flex items-center gap-1.5 text-[13px] font-medium text-amber-200">
                      <TriangleAlert className="size-3.5" aria-hidden /> {validated.warnings.length} quality warning(s)
                    </p>
                    <ul className="mt-1.5 max-h-64 list-disc overflow-y-auto pl-4 text-xs text-muted-foreground">
                      {validated.warnings.map((w, i) => (
                        <li key={i}>
                          <span className="font-mono">{w.path}</span>: {w.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {saved?.suite && (
              <Button asChild>
                <Link href={`/benchmarks/${saved.suite.id}`}>Open “{saved.suite.name}”</Link>
              </Button>
            )}
            <p className="border-t border-border pt-3 text-xs leading-relaxed text-subtle-foreground">
              Format reference: <span className="font-mono">packages/benchmarks/schemas/benchmark-dataset.schema.json</span>. Content marked “verified” must name its
              reviewer and review date.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
