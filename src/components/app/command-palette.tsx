'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Command } from 'cmdk';
import {
  BookOpen,
  Code2,
  CornerDownLeft,
  FileText,
  FlaskConical,
  FolderKanban,
  FolderPlus,
  KeyRound,
  Languages,
  LayoutDashboard,
  MessageSquare,
  Play,
  Search,
  Settings,
  Upload,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { RunStatusBadge, SimulatedBadge } from '@/components/app/status';
import { Kbd } from '@/components/ui/misc';
import { useProjects, useRuns } from '@/lib/api/hooks';
import { formatRelative, shortId } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/evaluations', label: 'Evaluations', icon: FlaskConical },
  { href: '/benchmarks', label: 'Benchmarks', icon: BookOpen },
  { href: '/insights', label: 'Language Insights', icon: Languages },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/developer', label: 'Developer API', icon: Code2 },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

const ACTIONS = [
  { href: '/evaluations/new', label: 'New evaluation', icon: Play, keywords: ['run', 'start', 'benchmark'] },
  { href: '/projects?create=1', label: 'Create a project', icon: FolderPlus, keywords: ['new', 'application'] },
  { href: '/benchmarks/import', label: 'Import a benchmark', icon: Upload, keywords: ['upload', 'json', 'suite'] },
  { href: '/developer', label: 'Create an API key', icon: KeyRound, keywords: ['token', 'sdk'] },
  { href: '/feedback', label: 'Send beta feedback', icon: MessageSquare, keywords: ['bug', 'idea'] },
];

const itemClass =
  'group flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] text-slate-300 outline-none select-none data-[selected=true]:bg-white/[0.06] data-[selected=true]:text-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-subtle-foreground data-[selected=true]:[&_svg]:text-violet-300';
const groupClass =
  '[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-subtle-foreground [&_[cmdk-group-heading]]:uppercase';

/** Data-backed groups mount only while the palette is open. */
function DynamicGroups({ go }: { go: (href: string) => void }) {
  const projects = useProjects();
  const runs = useRuns({ pageSize: 6 });
  return (
    <>
      {!!projects.data?.items.length && (
        <Command.Group heading="Projects" className={groupClass}>
          {projects.data.items.slice(0, 8).map((p) => (
            <Command.Item key={p.id} value={`project ${p.name} ${p.id}`} onSelect={() => go(`/projects/${p.id}`)} className={itemClass}>
              <FolderKanban />
              <span className="truncate">{p.name}</span>
              <span className="ml-auto text-[11px] text-subtle-foreground tabular">{p.runCount} runs</span>
            </Command.Item>
          ))}
        </Command.Group>
      )}
      {!!runs.data?.items.length && (
        <Command.Group heading="Recent runs" className={groupClass}>
          {runs.data.items.map((r) => (
            <Command.Item
              key={r.id}
              value={`run ${r.suite.name} ${r.project.name} ${r.id}`}
              onSelect={() => go(`/evaluations/${r.id}`)}
              className={itemClass}
            >
              <FlaskConical />
              <span className="min-w-0 truncate">
                {r.suite.name} <span className="text-subtle-foreground">· {r.project.name}</span>
              </span>
              <span className="ml-auto flex shrink-0 items-center gap-2">
                {r.isSimulated && <SimulatedBadge />}
                <RunStatusBadge status={r.status} />
                <span className="hidden font-mono text-[11px] text-subtle-foreground sm:inline">
                  #{shortId(r.id)} · {formatRelative(r.createdAt)}
                </span>
              </span>
            </Command.Item>
          ))}
        </Command.Group>
      )}
    </>
  );
}

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const go = React.useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router],
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed top-[12vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-[640px] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-[#121419]/95 shadow-pop backdrop-blur-xl animate-pop-in"
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <Command label="Command palette" loop>
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="size-4 shrink-0 text-subtle-foreground" aria-hidden />
              <Command.Input
                autoFocus
                placeholder="Search pages, projects and runs…"
                className="h-[52px] flex-1 bg-transparent text-[15px] text-foreground outline-hidden placeholder:text-subtle-foreground"
              />
              <Kbd>Esc</Kbd>
            </div>
            <Command.List className="max-h-[min(60vh,440px)] scroll-py-2 overflow-y-auto p-2">
              <Command.Empty className="px-3 py-10 text-center text-sm text-muted-foreground">No matches.</Command.Empty>
              <Command.Group heading="Actions" className={groupClass}>
                {ACTIONS.map(({ href, label, icon: Icon, keywords }) => (
                  <Command.Item key={label} value={label} keywords={keywords} onSelect={() => go(href)} className={itemClass}>
                    <Icon />
                    {label}
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading="Go to" className={groupClass}>
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                  <Command.Item key={href} value={`go ${label}`} onSelect={() => go(href)} className={itemClass}>
                    <Icon />
                    {label}
                  </Command.Item>
                ))}
              </Command.Group>
              {open && <DynamicGroups go={go} />}
            </Command.List>
            <div className="flex items-center justify-between gap-3 border-t border-border bg-white/[0.015] px-4 py-2.5 text-[11px] text-subtle-foreground">
              <span className="flex items-center gap-1.5">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> to navigate
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>
                  <CornerDownLeft className="size-3" />
                </Kbd>
                to open
              </span>
            </div>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
