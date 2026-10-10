'use client';

import { CircleCheck, FileJson, Upload } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/app/page';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox, Label, Textarea } from '@/components/ui/form-controls';
import { ApiError, errorMessage } from '@/lib/api/client';
import { useImportBenchmark, useMe } from '@/lib/api/hooks';
import type { ImportResult } from '@/lib/api/types';

const MAX_BYTES = 2 * 1024 * 1024;

export default function ImportBenchmarkPage() {
  const me = useMe();
  const importer = useImportBenchmark();
  const [text, setText] = React.useState('');
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [official, setOfficial] = React.useState(false);
  const [validated, setValidated] = React.useState<ImportResult | null>(null);
  const [saved, setSaved] = React.useState<ImportResult | null>(null);
  const isAdmin = me.data?.user.role === 'ADMIN';

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

  const details = importer.error instanceof ApiError && Array.isArray(importer.error.details)
    ? (importer.error.details as Array<{ path: string; message: string }>)
    : [];

  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/benchmarks" className="hover:text-foreground">
            Benchmarks
          </Link>
        }
        title="Import a benchmark dataset"
        description="Upload or paste a dataset in the AtlasGuard benchmark format (formatVersion 1). Validate first; nothing is saved until you import."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col gap-3 pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-elevated px-3 py-2 text-sm hover:bg-card-hover">
                <Upload className="size-4" /> Choose JSON file
                <input
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > MAX_BYTES) {
                      setParseError('File is larger than 2 MB.');
                      return;
                    }
                    setText(await file.text());
                    setValidated(null);
                    setSaved(null);
                  }}
                />
              </label>
              <span className="text-xs text-muted-foreground">or paste below · max 2 MB</span>
            </div>
            <Label htmlFor="dataset-json" className="sr-only">
              Dataset JSON
            </Label>
            <Textarea
              id="dataset-json"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setValidated(null);
                setSaved(null);
              }}
              rows={18}
              spellCheck={false}
              className="font-mono text-xs"
              placeholder='{ "formatVersion": 1, "suite": { "slug": "my-suite", "name": "My suite", "version": "1.0.0" }, "semanticGroups": [ … ] }'
            />
            {isAdmin && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={official} onCheckedChange={(v) => setOfficial(v === true)} /> Import as an official AtlasGuard suite
              </label>
            )}
            {parseError && <p className="text-sm text-red-300">{parseError}</p>}
            {importer.error && (
              <div role="alert" className="rounded-md border border-danger/30 bg-danger-soft p-3 text-sm">
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

        <Card>
          <CardHeader>
            <CardTitle>Validation</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            {!validated && !saved && <p className="text-muted-foreground">Validate the dataset to see its structure and quality warnings.</p>}
            {validated && (
              <>
                <p className="flex items-center gap-2 text-green-300">
                  <CircleCheck className="size-4" /> Valid dataset
                </p>
                <p className="text-muted-foreground">
                  {validated.counts.semanticGroups} semantic groups · {validated.counts.cases} cases
                </p>
                {validated.warnings.length > 0 && (
                  <div>
                    <p className="font-medium text-amber-200">{validated.warnings.length} quality warning(s)</p>
                    <ul className="mt-1 max-h-64 list-disc overflow-y-auto pl-4 text-xs text-muted-foreground">
                      {validated.warnings.map((w, i) => (
                        <li key={i}>
                          <span className="font-mono">{w.path}</span>: {w.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            {saved?.suite && (
              <Button asChild>
                <Link href={`/benchmarks/${saved.suite.id}`}>Open “{saved.suite.name}”</Link>
              </Button>
            )}
            <p className="text-xs text-subtle-foreground">
              Format reference: packages/benchmarks/schemas/benchmark-dataset.schema.json. Content marked “verified” must name its
              reviewer and review date.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
