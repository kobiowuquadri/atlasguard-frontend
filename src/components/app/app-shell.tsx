'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  BookOpen,
  ChevronRight,
  ChevronsUpDown,
  Code2,
  FileText,
  FlaskConical,
  FolderKanban,
  Languages,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Play,
  Search,
  Settings,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { CommandPalette } from '@/components/app/command-palette';
import { Logo } from '@/components/app/logo';
import { ModelStatusCard, SimulatedModeBanner } from '@/components/app/model-status';
import { Button } from '@/components/ui/button';
import { Kbd, Skeleton } from '@/components/ui/misc';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/overlays';
import { useLogout, useMe, useRuns } from '@/lib/api/hooks';
import { NATLAS_ATTRIBUTION } from '@/lib/constants';
import { cn, shortId } from '@/lib/utils';

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { href: '/overview', label: 'Overview', icon: LayoutDashboard },
      { href: '/projects', label: 'Projects', icon: FolderKanban },
    ],
  },
  {
    label: 'Evaluate',
    items: [
      { href: '/evaluations', label: 'Evaluations', icon: FlaskConical, live: true },
      { href: '/benchmarks', label: 'Benchmarks', icon: BookOpen },
      { href: '/insights', label: 'Language Insights', icon: Languages },
      { href: '/reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    label: 'Integrate',
    items: [
      { href: '/developer', label: 'Developer API', icon: Code2 },
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

/* ---------------------------------------------------------- breadcrumbs */

export interface Crumb {
  label: string;
  href?: string;
}

const CrumbContext = React.createContext<(crumbs: Crumb[] | null) => void>(() => {});

/** Pages with named resources replace the URL-derived trail (e.g. a project's name). */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const set = React.useContext(CrumbContext);
  const key = JSON.stringify(items);
  React.useEffect(() => {
    set(JSON.parse(key) as Crumb[]);
    return () => set(null);
  }, [key, set]);
  return null;
}

const SECTION_LABELS: Record<string, string> = {
  overview: 'Overview',
  projects: 'Projects',
  benchmarks: 'Benchmarks',
  evaluations: 'Evaluations',
  insights: 'Language Insights',
  reports: 'Reports',
  developer: 'Developer API',
  settings: 'Settings',
  feedback: 'Beta feedback',
};

function derivedCrumbs(pathname: string): Crumb[] {
  const [section, child] = pathname.split('/').filter(Boolean);
  if (!section) return [];
  const crumbs: Crumb[] = [{ label: SECTION_LABELS[section] ?? section, href: `/${section}` }];
  if (child) crumbs.push({ label: child === 'new' ? 'New' : child === 'import' ? 'Import' : `#${shortId(child)}` });
  return crumbs;
}

function Trail({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-[13px]">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={`${c.label}-${i}`} className={cn('flex min-w-0 items-center gap-1.5', !last && 'hidden sm:flex')}>
              {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-subtle-foreground/70" aria-hidden />}
              {c.href && !last ? (
                <Link href={c.href} className="truncate text-muted-foreground transition-colors hover:text-foreground">
                  {c.label}
                </Link>
              ) : (
                <span className={cn('truncate', last ? 'font-medium text-foreground' : 'text-muted-foreground')} aria-current={last ? 'page' : undefined}>
                  {c.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* -------------------------------------------------------------- sidebar */

function useModKey() {
  const [mac, setMac] = React.useState(false);
  React.useEffect(() => setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)), []);
  return mac ? '⌘' : 'Ctrl';
}

function RunningCount() {
  const runs = useRuns({ status: 'RUNNING', pageSize: 5 }, { live: true });
  const count = runs.data?.meta?.total ?? 0;
  if (!count) return null;
  return (
    <span className="ml-auto inline-flex h-5 items-center gap-1.5 rounded-full bg-primary-soft px-1.5 text-[11px] font-medium text-violet-200 inset-ring inset-ring-violet-400/25" title={`${count} running`}>
      <span className="relative flex size-1.5" aria-hidden>
        <span className="absolute inset-0 rounded-full bg-violet-300 animate-ping-slow" />
        <span className="relative size-1.5 rounded-full bg-violet-300" />
      </span>
      <span className="tabular">{count}</span>
      <span className="sr-only">running</span>
    </span>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="eyebrow mb-1.5 px-2.5">{group.label}</div>
          <ul className="flex flex-col gap-px">
            {group.items.map(({ href, label, icon: Icon, live }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors',
                      active ? 'bg-white/[0.06] font-medium text-foreground' : 'text-muted-foreground hover:bg-white/[0.035] hover:text-foreground',
                    )}
                  >
                    {active && <span className="absolute top-1.5 bottom-1.5 -left-3 w-[3px] rounded-r-full bg-brand" aria-hidden />}
                    <Icon className={cn('size-4 shrink-0', active ? 'text-violet-300' : 'text-subtle-foreground group-hover:text-muted-foreground')} aria-hidden />
                    {label}
                    {live && <RunningCount />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function UserRow() {
  const { data } = useMe();
  const logout = useLogout();
  const router = useRouter();
  const user = data?.user;
  if (!user) return <Skeleton className="h-11 w-full rounded-lg" />;
  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-white/[0.04] data-[state=open]:bg-white/[0.05]"
          aria-label="Account menu"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6,#0891b2)] text-[11px] font-semibold text-white">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-foreground">{user.name}</span>
            <span className="block truncate text-[11px] text-subtle-foreground">{user.role === 'ADMIN' ? 'Administrator' : user.email}</span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-subtle-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56">
        <DropdownMenuLabel>
          <div className="text-[13px] text-foreground">{user.name}</div>
          <div className="truncate">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push('/settings')}>
          <Settings /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push('/feedback')}>
          <MessageSquare /> Beta feedback
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() =>
            logout.mutate(undefined, {
              onSettled: () => {
                window.location.href = '/login';
              },
            })
          }
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SidebarBody({ onNavigate, onSearch }: { onNavigate?: () => void; onSearch: () => void }) {
  const mod = useModKey();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center px-4">
        <Link href="/overview" onClick={onNavigate} className="rounded-md">
          <Logo tag="beta" />
        </Link>
      </div>
      <div className="px-3 pb-4">
        <button
          type="button"
          onClick={onSearch}
          className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 text-[13px] text-subtle-foreground inset-ring inset-ring-white/[0.08] transition-colors hover:bg-white/[0.05] hover:text-muted-foreground"
        >
          <Search className="size-4" aria-hidden />
          Search…
          <span className="ml-auto flex gap-1">
            <Kbd>{mod}</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <NavLinks onNavigate={onNavigate} />
      </div>
      <div className="flex shrink-0 flex-col gap-3 border-t border-border p-3">
        <ModelStatusCard onNavigate={onNavigate} />
        <UserRow />
        <p className="px-1.5 text-[10.5px] leading-snug text-subtle-foreground">{NATLAS_ATTRIBUTION}</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- shell */

export function AppShell({ children }: { children: React.ReactNode }) {
  const [navOpen, setNavOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [crumbOverride, setCrumbOverride] = React.useState<Crumb[] | null>(null);
  const me = useMe();
  const pathname = usePathname();
  const mod = useModKey();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openSearch = React.useCallback(() => {
    setNavOpen(false);
    setPaletteOpen(true);
  }, []);
  const crumbs = crumbOverride ?? derivedCrumbs(pathname);

  return (
    <CrumbContext.Provider value={setCrumbOverride}>
      <div className="flex min-h-dvh">
        <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 border-r border-border bg-panel lg:block">
          <SidebarBody onSearch={openSearch} />
        </aside>

        <DialogPrimitive.Root open={navOpen} onOpenChange={setNavOpen}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in lg:hidden" />
            <DialogPrimitive.Content
              aria-describedby={undefined}
              className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-border bg-panel shadow-pop animate-fade-in lg:hidden"
            >
              <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
              <DialogPrimitive.Close
                className="absolute top-3.5 right-3 flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-white/[0.06]"
                aria-label="Close navigation"
              >
                <X className="size-4" />
              </DialogPrimitive.Close>
              <SidebarBody onNavigate={() => setNavOpen(false)} onSearch={openSearch} />
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>

        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

        <div className="flex min-w-0 flex-1 flex-col">
          <SimulatedModeBanner />
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
            <Button variant="ghost" size="icon-sm" className="-ml-1 lg:hidden" onClick={() => setNavOpen(true)} aria-label="Open navigation">
              <Menu />
            </Button>
            <Trail crumbs={crumbs} />
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={openSearch} className="text-subtle-foreground" aria-label="Search">
                <Search />
                <span className="hidden items-center gap-1 md:flex lg:hidden">
                  <Kbd>{mod}</Kbd>
                  <Kbd>K</Kbd>
                </span>
              </Button>
              {!pathname.startsWith('/evaluations/new') && (
                <Button asChild size="sm">
                  <Link href="/evaluations/new">
                    <Play /> <span className="hidden sm:inline">New evaluation</span>
                    <span className="sm:hidden">Run</span>
                  </Link>
                </Button>
              )}
            </div>
          </header>
          <main id="main" className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
            {me.isLoading ? (
              <div className="flex flex-col gap-4" aria-label="Loading">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-72" />
                <Skeleton className="mt-4 h-36 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </CrumbContext.Provider>
  );
}
