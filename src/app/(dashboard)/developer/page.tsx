'use client';

import { BookOpen, ExternalLink, KeyRound, Plus, Trash2, TriangleAlert } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { EmptyState, PageHeader } from '@/components/app/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/form-controls';
import { CodeBlock, CopyButton, Table, Td, Th } from '@/components/ui/misc';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/overlays';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { errorMessage } from '@/lib/api/client';
import { useApiKeys, useCreateApiKey, useProjects, useRevokeApiKey } from '@/lib/api/hooks';
import { formatDateTime, formatRelative } from '@/lib/utils';

const ANY_PROJECT = '__any__';

function CreateKeyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const projects = useProjects();
  const create = useCreateApiKey();
  const [name, setName] = React.useState('');
  const [projectId, setProjectId] = React.useState(ANY_PROJECT);
  const [secret, setSecret] = React.useState<string | null>(null);

  const close = (o: boolean) => {
    if (!o) {
      setSecret(null);
      setName('');
      setProjectId(ANY_PROJECT);
      create.reset();
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        {secret ? (
          <>
            <DialogHeader>
              <DialogTitle>Copy your API key now</DialogTitle>
              <DialogDescription>For your security this key is shown once. AtlasGuard stores only a hash of it.</DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 rounded-xl border border-violet-400/30 bg-primary-soft/50 p-3.5">
              <code className="min-w-0 flex-1 font-mono text-[13px] break-all text-violet-100">{secret}</code>
              <CopyButton value={secret} />
            </div>
            <p className="flex items-start gap-2 text-xs leading-relaxed text-amber-200">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" /> Keep it server-side (environment variable). Never put it in browser code or commit
              it to a repository.
            </p>
            <DialogFooter>
              <Button onClick={() => close(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create API key</DialogTitle>
              <DialogDescription>Use API keys with the SDK or REST API. Restricting a key to one project is recommended.</DialogDescription>
            </DialogHeader>
            <Field label="Name" htmlFor="key-name" hint="e.g. “CI pipeline” or “Staging server”">
              <Input id="key-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            </Field>
            <Field label="Project access" htmlFor="key-project">
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="key-project">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY_PROJECT}>All my projects</SelectItem>
                  {projects.data?.items.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      Only “{p.name}”
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {create.error ? <p className="text-sm text-red-300">{errorMessage(create.error)}</p> : null}
            <DialogFooter>
              <Button variant="ghost" onClick={() => close(false)}>
                Cancel
              </Button>
              <Button
                disabled={name.trim().length < 2}
                loading={create.isPending}
                onClick={() =>
                  create.mutate({ name: name.trim(), projectId: projectId === ANY_PROJECT ? undefined : projectId }, { onSuccess: (res) => setSecret(res.key) })
                }
              >
                Create key
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function examples(baseUrl: string) {
  const sdk = `import { AtlasGuard } from '@atlasguard/sdk';

const atlas = new AtlasGuard({
  baseUrl: process.env.ATLASGUARD_BASE_URL!, // ${baseUrl}
  apiKey: process.env.ATLASGUARD_API_KEY!,
});

const { items: suites } = await atlas.benchmarks.list();

const run = await atlas.evaluations.run({
  projectId: 'YOUR_PROJECT_ID',
  suiteId: suites[0].id,
  languages: ['en-NG', 'yo', 'ha', 'ig'],
});

// Cases run asynchronously on the server; poll until the run finishes.
const finished = await atlas.evaluations.waitForCompletion(run.id, {
  onProgress: (r) => console.log(\`\${r.progress.done}/\${r.progress.total}\`),
});
console.log(finished.summary?.overall.verifiedPassRate);

const consistency = await atlas.evaluations.consistency(run.id);
const csv = await atlas.reports.export(run.id, 'csv');`;

  const curl = `export ATLASGUARD_API_KEY=ag_...   # keep secret
BASE=${baseUrl}

# List benchmark suites
curl -s "$BASE/benchmarks" -H "Authorization: Bearer $ATLASGUARD_API_KEY"

# Queue an evaluation run
curl -s -X POST "$BASE/evaluations/runs" \\
  -H "Authorization: Bearer $ATLASGUARD_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"projectId":"YOUR_PROJECT_ID","suiteId":"SUITE_ID","languages":["en-NG","yo"]}'

# Poll the run, then download results as CSV
curl -s "$BASE/evaluations/runs/RUN_ID" -H "Authorization: Bearer $ATLASGUARD_API_KEY"
curl -s "$BASE/reports/RUN_ID/export?format=csv" -H "Authorization: Bearer $ATLASGUARD_API_KEY" -o results.csv`;

  const js = `const BASE = '${baseUrl}';
const headers = { Authorization: \`Bearer \${process.env.ATLASGUARD_API_KEY}\`, 'Content-Type': 'application/json' };

const res = await fetch(\`\${BASE}/evaluations/runs\`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ projectId: 'YOUR_PROJECT_ID', suiteId: 'SUITE_ID', languages: ['yo', 'ha'] }),
});
const body = await res.json();
if (!body.success) throw new Error(\`\${body.error.code}: \${body.error.message}\`);
console.log('queued run', body.data.id);`;

  return { sdk, curl, js };
}

const QUICKSTART = [
  ['01', 'Create a key', 'Restrict it to one project and keep it in an environment variable.'],
  ['02', 'Install the SDK', 'Typed client for Node.js 18+ and modern browsers — zero runtime dependencies.'],
  ['03', 'Run from CI', 'Queue a run, wait for completion and fail the build on regressions.'],
];

export default function DeveloperPage() {
  const keys = useApiKeys();
  const revoke = useRevokeApiKey();
  const [open, setOpen] = React.useState(false);
  const [baseUrl, setBaseUrl] = React.useState('https://your-atlasguard-host/api/v1');
  React.useEffect(() => setBaseUrl(`${window.location.origin}/api/v1`), []);
  const code = examples(baseUrl);

  return (
    <>
      <PageHeader
        title="Developer API"
        description="Integrate AtlasGuard evaluations into scripts and CI with the REST API or the TypeScript SDK."
        actions={
          <Button asChild variant="secondary">
            <a href="/api/docs" target="_blank" rel="noreferrer">
              <BookOpen /> OpenAPI docs <ExternalLink className="text-subtle-foreground" />
            </a>
          </Button>
        }
      />
      <CreateKeyDialog open={open} onOpenChange={setOpen} />

      <ol className="mb-6 grid gap-px overflow-hidden rounded-xl border border-border bg-border shadow-card md:grid-cols-3">
        {QUICKSTART.map(([n, title, body]) => (
          <li key={n} className="bg-card px-5 py-4">
            <span className="font-mono text-[11px] text-violet-300">{n}</span>
            <div className="mt-1.5 text-sm font-medium">{title}</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
          </li>
        ))}
      </ol>

      <Card className="mb-4">
        <CardHeader
          action={
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus /> Create key
            </Button>
          }
        >
          <CardTitle>API keys</CardTitle>
          <CardDescription>Keys are shown once at creation; AtlasGuard stores only a hash.</CardDescription>
        </CardHeader>
        <CardContent className={keys.data && keys.data.length > 0 ? 'px-2' : undefined}>
          {keys.data && keys.data.length === 0 ? (
            <EmptyState icon={KeyRound} title="No API keys yet" description="Create a key to call the API or SDK from your own code." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Key</Th>
                  <Th>Access</Th>
                  <Th>Last used</Th>
                  <Th>Created</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {keys.data?.map((k) => (
                  <tr key={k.id} className={k.revokedAt ? 'opacity-50' : 'hover:bg-white/[0.02]'}>
                    <Td className="font-medium">{k.name}</Td>
                    <Td>
                      <code className="rounded-md bg-white/[0.05] px-1.5 py-0.5 font-mono text-xs text-slate-300 inset-ring inset-ring-white/10">{k.keyPrefix}…</code>
                    </Td>
                    <Td className="text-muted-foreground">{k.project ? `Only ${k.project.name}` : 'All projects'}</Td>
                    <Td className="text-muted-foreground">{k.lastUsedAt ? formatRelative(k.lastUsedAt) : 'Never'}</Td>
                    <Td className="text-muted-foreground">{formatDateTime(k.createdAt)}</Td>
                    <Td className="text-right">
                      {k.revokedAt ? (
                        <Badge variant="neutral">Revoked</Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={revoke.isPending && revoke.variables === k.id}
                          onClick={() => revoke.mutate(k.id, { onSuccess: () => toast.success('API key revoked') })}
                        >
                          <Trash2 /> Revoke
                        </Button>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Examples</CardTitle>
            <CardDescription>
              Responses are <code className="font-mono text-slate-300">{'{ success, data }'}</code> or{' '}
              <code className="font-mono text-slate-300">{'{ success: false, error: { code, message, requestId } }'}</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-inset px-3 py-2 inset-ring inset-ring-white/[0.07]">
              <span className="eyebrow shrink-0">Base URL</span>
              <code className="min-w-0 flex-1 truncate font-mono text-xs text-slate-200">{baseUrl}</code>
              <CopyButton value={baseUrl} />
            </div>
            <Tabs defaultValue="sdk">
              <TabsList variant="pill">
                <TabsTrigger value="sdk">TypeScript SDK</TabsTrigger>
                <TabsTrigger value="curl">curl</TabsTrigger>
                <TabsTrigger value="js">JavaScript</TabsTrigger>
              </TabsList>
              <TabsContent value="sdk" className="mt-4">
                <CodeBlock title="evaluate.ts" code={code.sdk} />
              </TabsContent>
              <TabsContent value="curl" className="mt-4">
                <CodeBlock title="run.sh" code={code.curl} />
              </TabsContent>
              <TabsContent value="js" className="mt-4">
                <CodeBlock title="queue-run.mjs" code={code.js} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Install the SDK</CardTitle>
            <CardDescription>Not published to npm yet — build it from the repository.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-[13px] leading-relaxed text-muted-foreground">
            <p>
              <code className="font-mono text-foreground">@atlasguard/sdk</code> lives in <code className="font-mono">packages/sdk</code> of the AtlasGuard
              repository. Build it and install the local package:
            </p>
            <CodeBlock
              title="terminal"
              code={`git clone https://github.com/kobiowuquadri/atlasguard-backend.git && cd atlasguard-backend
pnpm install && pnpm --filter @atlasguard/sdk build
cd packages/sdk && npm pack
# in your project:
npm install /path/to/atlasguard-sdk-0.1.0.tgz`}
            />
            <p>Requires Node.js 18+ (global fetch) or any modern browser runtime. Keep API keys server-side.</p>
            <p>
              Authentication: <code className="font-mono text-foreground">Authorization: Bearer ag_…</code> (or <code className="font-mono">X-API-Key</code>). Keys
              restricted to a project can only see that project.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
