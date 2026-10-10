'use client';

import { BookOpen, ExternalLink, KeyRound, Plus, Trash2, TriangleAlert } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { EmptyState, PageHeader } from '@/components/app/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
            <div className="flex items-center gap-2 rounded-md border border-border bg-background-subtle p-3">
              <code className="min-w-0 flex-1 break-all text-sm">{secret}</code>
              <CopyButton value={secret} />
            </div>
            <p className="flex items-start gap-2 text-xs text-amber-200">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" /> Keep it server-side (environment variable). Never put it in browser
              code or commit it to a repository.
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
                  create.mutate(
                    { name: name.trim(), projectId: projectId === ANY_PROJECT ? undefined : projectId },
                    { onSuccess: (res) => setSecret(res.key) },
                  )
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
              <BookOpen /> OpenAPI docs <ExternalLink />
            </a>
          </Button>
        }
      />
      <CreateKeyDialog open={open} onOpenChange={setOpen} />

      <Card className="mb-4">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>API keys</CardTitle>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus /> Create key
          </Button>
        </CardHeader>
        <CardContent>
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
                  <tr key={k.id} className={k.revokedAt ? 'opacity-50' : undefined}>
                    <Td className="font-medium">{k.name}</Td>
                    <Td className="font-mono text-xs">{k.keyPrefix}…</Td>
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Examples</CardTitle>
            <p className="text-xs text-muted-foreground">
              Base URL: <code className="text-foreground">{baseUrl}</code> · responses are <code>{'{ success, data }'}</code> or{' '}
              <code>{'{ success: false, error: { code, message, requestId } }'}</code>
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="sdk">
              <TabsList>
                <TabsTrigger value="sdk">TypeScript SDK</TabsTrigger>
                <TabsTrigger value="curl">curl</TabsTrigger>
                <TabsTrigger value="js">JavaScript</TabsTrigger>
              </TabsList>
              <TabsContent value="sdk">
                <CodeBlock language="typescript" code={code.sdk} />
              </TabsContent>
              <TabsContent value="curl">
                <CodeBlock language="bash" code={code.curl} />
              </TabsContent>
              <TabsContent value="js">
                <CodeBlock language="javascript" code={code.js} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Install the SDK</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>
              <code className="text-foreground">@atlasguard/sdk</code> lives in <code>packages/sdk</code> of the AtlasGuard repository and is
              not published to npm yet. Build it and install the local package:
            </p>
            <CodeBlock
              language="bash"
              code={`git clone https://github.com/kobiowuquadri/atlasguard-backend.git && cd atlasguard-backend
pnpm install && pnpm --filter @atlasguard/sdk build
cd packages/sdk && npm pack
# in your project:
npm install /path/to/atlasguard-sdk-0.1.0.tgz`}
            />
            <p>Requires Node.js 18+ (global fetch) or any modern browser runtime. Keep API keys server-side.</p>
            <p>
              Authentication: <code className="text-foreground">Authorization: Bearer ag_…</code> (or <code>X-API-Key</code>). Keys
              restricted to a project can only see that project.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
