import Link from 'next/link';
import { Logo } from '@/components/app/logo';
import { NATLAS_ATTRIBUTION } from '@/lib/constants';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.18),transparent_70%)]"
      />
      <Link href="/" className="relative mb-8">
        <Logo />
      </Link>
      <main id="main" className="relative w-full max-w-sm">
        {children}
      </main>
      <p className="relative mt-10 max-w-sm text-center text-[11px] leading-snug text-subtle-foreground">{NATLAS_ATTRIBUTION}</p>
    </div>
  );
}
