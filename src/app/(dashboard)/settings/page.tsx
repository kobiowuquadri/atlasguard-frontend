'use client';

import { Cpu, Download, MessageSquare, RotateCw, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/app/page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/form-controls';
import { useQueryClient } from '@tanstack/react-query';
import { api, downloadFile, errorMessage } from '@/lib/api/client';
import { useMe, useModelStatus, useUpdateProfile } from '@/lib/api/hooks';
import type { ModelStatus } from '@/lib/api/types';
import { NATLAS_ATTRIBUTION } from '@/lib/constants';
import { formatDateTime, formatMs } from '@/lib/utils';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="contents">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

export default function SettingsPage() {
  const me = useMe();
  const status = useModelStatus();
  const update = useUpdateProfile();
  const qc = useQueryClient();
  const [name, setName] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);
  React.useEffect(() => {
    if (me.data) setName(me.data.user.name);
  }, [me.data]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      qc.setQueryData(['model-status'], await api.get<ModelStatus>('/model/status', { refresh: true }));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setRefreshing(false);
    }
  };

  const user = me.data?.user;
  const natlas = status.data?.natlas;
  const health = natlas?.health;

  return (
    <>
      <PageHeader title="Settings" description="Your profile, the N-ATLaS connection and licence information." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                update.mutate({ name: name.trim() }, { onSuccess: () => toast.success('Profile updated'), onError: (err) => toast.error(errorMessage(err)) });
              }}
            >
              <Field label="Name" htmlFor="profile-name">
                <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={100} required />
              </Field>
              <Field label="Email" htmlFor="profile-email">
                <Input id="profile-email" value={user?.email ?? ''} disabled />
              </Field>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Role: {user?.role === 'ADMIN' ? <Badge variant="primary">Administrator</Badge> : <Badge>Developer</Badge>}
              </div>
              <Button type="submit" className="self-start" loading={update.isPending} disabled={name.trim().length < 2}>
                Save
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card id="model">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Cpu className="size-4 text-violet-300" /> N-ATLaS connection
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => void refresh()} loading={refreshing}>
              <RotateCw /> Check now
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            {health && natlas && (
              <>
                <dl className="grid grid-cols-[9rem_1fr] gap-x-3 gap-y-1.5">
                  <Row label="Status">
                    <Badge variant={health.status === 'available' ? 'success' : health.status === 'not_configured' ? 'neutral' : 'danger'}>
                      {health.status === 'available' ? 'Connected' : health.status === 'not_configured' ? 'Not configured' : 'Unavailable'}
                    </Badge>
                  </Row>
                  <Row label="Message">{health.message}</Row>
                  <Row label="Health latency">{formatMs(health.latencyMs)}</Row>
                  <Row label="Checked">{formatDateTime(health.checkedAt)}</Row>
                  <Row label="Model">
                    <span className="font-mono text-xs">{natlas.model.modelIdentifier}</span>
                  </Row>
                  {natlas.model.reportedBy === 'provider' && (
                    <>
                      <Row label="Served model">
                        <span className="font-mono text-xs">{natlas.model.servedModel ?? '—'}</span>
                      </Row>
                      <Row label="Revision">
                        <span className="font-mono text-xs">{natlas.model.revision ?? '—'}</span>
                      </Row>
                      <Row label="Runtime">
                        {[natlas.model.dtype, natlas.model.quantization, natlas.model.device, natlas.model.runtime].filter(Boolean).join(' · ') || '—'}
                      </Row>
                    </>
                  )}
                </dl>
                {health.status !== 'available' && (
                  <p className="rounded-md border border-border bg-background-subtle p-3 text-xs text-muted-foreground">
                    The server administrator connects N-ATLaS by setting <code className="text-foreground">NATLAS_BASE_URL</code> and{' '}
                    <code className="text-foreground">NATLAS_API_KEY</code> on the AtlasGuard API. The official weights can be served
                    with the AtlasGuard inference service on a GPU (see <code>docs/natlas-integration.md</code>). AtlasGuard never
                    falls back to another model.
                  </p>
                )}
              </>
            )}
            {status.data?.fixtures.enabled && (
              <p className="rounded-md border border-warning/30 bg-warning-soft p-3 text-xs text-amber-100">
                Simulated development fixtures are enabled on this server. Fixture runs are labelled and excluded from evidence exports.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-violet-300" /> Licence & attribution
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>{NATLAS_ATTRIBUTION}</p>
            <p>
              N-ATLaS weights are distributed by NCAIR1 on Hugging Face under their own licence, which caps use at 1,000 active end
              users without a commercial licence and requires attribution. AtlasGuard does not redistribute the weights.
            </p>
            <p>AtlasGuard’s own source code is released separately under the MIT licence.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-4 text-violet-300" /> Beta testing
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>Help improve AtlasGuard: try the platform and tell us what worked and what didn’t.</p>
            <Button asChild variant="secondary" className="self-start">
              <Link href="/feedback">Give beta feedback</Link>
            </Button>
            {user?.role === 'ADMIN' && (
              <Button
                variant="ghost"
                className="self-start"
                onClick={() => downloadFile('/feedback/export', undefined, 'atlasguard-beta-feedback.json').catch((e) => toast.error(errorMessage(e)))}
              >
                <Download /> Export consented feedback (admin)
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
