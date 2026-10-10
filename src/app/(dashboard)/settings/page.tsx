'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Cpu, Download, FlaskConical, MessageSquare, RotateCw, ShieldCheck, UserRound } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/app/page';
import { StatusDot } from '@/components/app/status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/form-controls';
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

function IconTile({ icon: Icon }: { icon: React.ComponentType<{ className?: string }> }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.05] inset-ring inset-ring-white/10">
      <Icon className="size-4 text-violet-200" />
    </span>
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
  const tone = health?.status === 'available' ? 'success' : health?.status === 'not_configured' ? 'neutral' : 'danger';

  return (
    <>
      <PageHeader title="Settings" description="Your profile, the N-ATLaS connection and licence information." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <IconTile icon={UserRound} />
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>How you appear on reviews and runs</CardDescription>
              </div>
            </div>
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
              <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
                  Role {user?.role === 'ADMIN' ? <Badge variant="primary">Administrator</Badge> : <Badge>Developer</Badge>}
                </span>
                <Button type="submit" loading={update.isPending} disabled={name.trim().length < 2}>
                  Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card id="model" className="scroll-mt-24">
          <CardHeader
            action={
              <Button variant="secondary" size="sm" onClick={() => void refresh()} loading={refreshing}>
                <RotateCw /> Check now
              </Button>
            }
          >
            <div className="flex items-center gap-3">
              <IconTile icon={Cpu} />
              <div>
                <CardTitle>N-ATLaS connection</CardTitle>
                <CardDescription>Live health of the inference endpoint</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-[13px]">
            {health && natlas && (
              <>
                <div className="flex items-center gap-3 rounded-xl bg-inset px-4 py-3 inset-ring inset-ring-white/[0.07]">
                  <StatusDot tone={tone} pulse={tone === 'success'} />
                  <span className="font-medium">
                    {health.status === 'available' ? 'Connected' : health.status === 'not_configured' ? 'Not configured' : 'Unavailable'}
                  </span>
                  <span className="ml-auto truncate font-mono text-xs text-subtle-foreground">{natlas.model.modelIdentifier}</span>
                </div>
                <dl className="grid grid-cols-[8.5rem_1fr] gap-x-3 gap-y-2">
                  <Row label="Message">{health.message}</Row>
                  <Row label="Health latency">
                    <span className="font-mono text-xs">{formatMs(health.latencyMs)}</span>
                  </Row>
                  <Row label="Checked">{formatDateTime(health.checkedAt)}</Row>
                  {natlas.model.reportedBy === 'provider' && (
                    <>
                      <Row label="Served model">
                        <span className="font-mono text-xs">{natlas.model.servedModel ?? '—'}</span>
                      </Row>
                      <Row label="Revision">
                        <span className="font-mono text-xs">{natlas.model.revision ?? '—'}</span>
                      </Row>
                      <Row label="Runtime">{[natlas.model.dtype, natlas.model.quantization, natlas.model.device, natlas.model.runtime].filter(Boolean).join(' · ') || '—'}</Row>
                    </>
                  )}
                </dl>
                {health.status !== 'available' && (
                  <p className="rounded-xl border border-border bg-inset p-3.5 text-xs leading-relaxed text-muted-foreground">
                    The server administrator connects N-ATLaS by setting <code className="font-mono text-foreground">NATLAS_BASE_URL</code> and{' '}
                    <code className="font-mono text-foreground">NATLAS_API_KEY</code> on the AtlasGuard API. The official weights can be served with the
                    AtlasGuard inference service on a GPU (see <code className="font-mono">docs/natlas-integration.md</code>). AtlasGuard never falls back to
                    another model.
                  </p>
                )}
              </>
            )}
            {status.data?.fixtures.enabled && (
              <p className="flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-warning-soft p-3.5 text-xs leading-relaxed text-amber-100">
                <FlaskConical className="mt-px size-3.5 shrink-0 text-amber-300" aria-hidden />
                Simulated development fixtures are enabled on this server. Fixture runs are labelled and excluded from evidence exports.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <IconTile icon={ShieldCheck} />
              <div>
                <CardTitle>Licence & attribution</CardTitle>
                <CardDescription>Terms that apply to the model and this platform</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-[13px] leading-relaxed text-muted-foreground">
            <p className="rounded-xl bg-inset p-3.5 text-slate-300 inset-ring inset-ring-white/[0.07]">{NATLAS_ATTRIBUTION}</p>
            <p>
              N-ATLaS weights are distributed by NCAIR1 on Hugging Face under their own licence, which caps use at 1,000 active end users without a
              commercial licence and requires attribution. AtlasGuard does not redistribute the weights.
            </p>
            <p>AtlasGuard’s own source code is released separately under the MIT licence.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <IconTile icon={MessageSquare} />
              <div>
                <CardTitle>Beta testing</CardTitle>
                <CardDescription>Help shape what AtlasGuard becomes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-[13px] text-muted-foreground">
            <p>Try the platform and tell us what worked and what didn’t. Feedback is only stored with your consent.</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary">
                <Link href="/feedback">Give beta feedback</Link>
              </Button>
              {user?.role === 'ADMIN' && (
                <Button
                  variant="ghost"
                  onClick={() => downloadFile('/feedback/export', undefined, 'atlasguard-beta-feedback.json').catch((e) => toast.error(errorMessage(e)))}
                >
                  <Download /> Export consented feedback (admin)
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
