import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/app/logo';
import { ContourField, GridBackdrop } from '@/components/app/patterns';
import { NATLAS_ATTRIBUTION } from '@/lib/constants';

const LANGS = [
  ['EN', 'Nigerian English'],
  ['YO', 'Èdè Yorùbá'],
  ['HA', 'Harshen Hausa'],
  ['IG', 'Asụsụ Igbo'],
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <aside className="relative hidden overflow-hidden border-r border-border bg-panel lg:block">
        <ContourField className="opacity-90" />
        <GridBackdrop />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Link href="/" className="self-start rounded-md">
            <Logo />
          </Link>
          <div className="max-w-md">
            <p className="font-mono text-[11px] tracking-[0.08em] text-violet-300/90 uppercase">Cross-language consistency</p>
            <p className="mt-5 font-serif text-[40px] leading-[1.1] tracking-[-0.01em] text-balance text-foreground">
              The same question in four languages should get <span className="italic text-brand">the same facts.</span>
            </p>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">AtlasGuard measures whether N-ATLaS does — and shows you where it doesn’t.</p>
            <ul className="mt-8 flex flex-wrap gap-2">
              {LANGS.map(([code, name]) => (
                <li key={code} className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] py-1 pr-3 pl-1 text-xs text-slate-300 inset-ring inset-ring-white/10">
                  <span className="rounded-full bg-white/[0.07] px-1.5 py-0.5 font-mono text-[10px]">{code}</span>
                  {name}
                </li>
              ))}
            </ul>
          </div>
          <p className="max-w-md text-[11px] leading-relaxed text-subtle-foreground">{NATLAS_ATTRIBUTION}</p>
        </div>
      </aside>

      <div className="relative flex min-h-dvh flex-col">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgb(124_58_237/0.12),transparent_70%)] lg:hidden" />
        <header className="relative flex h-16 items-center justify-between px-6">
          <Link href="/" className="rounded-md lg:invisible">
            <Logo />
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-3.5" aria-hidden /> Back to site
          </Link>
        </header>
        <main id="main" className="relative flex flex-1 items-center justify-center px-5 py-10">
          <div className="w-full max-w-[380px] animate-enter">{children}</div>
        </main>
        <p className="relative px-6 pb-6 text-center text-[11px] leading-relaxed text-subtle-foreground lg:hidden">{NATLAS_ATTRIBUTION}</p>
      </div>
    </div>
  );
}
