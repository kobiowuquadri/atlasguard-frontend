'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  BookOpen,
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
  Settings,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Logo } from '@/components/app/logo';
import { ModelStatusPill, SimulatedModeBanner } from '@/components/app/model-status';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/overlays';
import { Skeleton } from '@/components/ui/misc';
import { useLogout, useMe } from '@/lib/api/hooks';
import { NATLAS_ATTRIBUTION } from '@/lib/constants';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/benchmarks', label: 'Benchmarks', icon: BookOpen },
  { href: '/evaluations', label: 'Evaluations', icon: FlaskConical },
  { href: '/insights', label: 'Language Insights', icon: Languages },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/developer', label: 'Developer API', icon: Code2 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
              active ? 'bg-primary-soft text-foreground' : 'text-muted-foreground hover:bg-card-hover hover:text-foreground',
            )}
          >
            <Icon className={cn('size-4', active ? 'text-violet-300' : '')} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href="/overview" onClick={onNavigate} className="px-1.5 pt-1">
        <Logo />
      </Link>
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto flex flex-col gap-3">
        <Link
          href="/feedback"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground"
        >
          <MessageSquare className="size-4" aria-hidden />
          Beta feedback
        </Link>
        <p className="px-2.5 text-[11px] leading-snug text-subtle-foreground">{NATLAS_ATTRIBUTION}</p>
      </div>
    </div>
  );
}

function UserMenu() {
  const { data } = useMe();
  const logout = useLogout();
  const router = useRouter();
  const user = data?.user;
  if (!user) return <Skeleton className="size-8 rounded-full" />;
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
          className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-violet-200 ring-1 ring-primary/30"
          aria-label="Account menu"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="text-sm text-foreground">{user.name}</div>
          <div className="truncate">{user.email}</div>
          {user.role === 'ADMIN' && <div className="mt-1 text-violet-300">Administrator</div>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push('/settings')}>
          <Settings /> Settings
        </DropdownMenuItem>
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const me = useMe();

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-border bg-background-subtle lg:block">
        <SidebarBody />
      </aside>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/60 lg:hidden" />
          <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-background-subtle animate-fade-in lg:hidden">
            <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
            <DialogPrimitive.Close className="absolute top-4 right-3 cursor-pointer text-muted-foreground" aria-label="Close navigation">
              <X className="size-5" />
            </DialogPrimitive.Close>
            <SidebarBody onNavigate={() => setOpen(false)} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <div className="flex min-w-0 flex-1 flex-col">
        <SimulatedModeBanner />
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
            <Menu />
          </Button>
          <div className="ml-auto flex items-center gap-3">
            <ModelStatusPill className="hidden sm:inline-flex" />
            <Button asChild size="sm">
              <Link href="/evaluations/new">
                <Play /> New evaluation
              </Link>
            </Button>
            <UserMenu />
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
          {me.isLoading ? (
            <div className="flex flex-col gap-4" aria-label="Loading">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
