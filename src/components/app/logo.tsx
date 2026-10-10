import { cn } from '@/lib/utils';

/** AtlasGuard mark: a shield whose inner arc suggests a globe meridian. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-7', className)} aria-hidden>
      <defs>
        <linearGradient id="ag-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path d="M16 2.5 4.5 7v8.2c0 7.1 4.9 12.6 11.5 14.3 6.6-1.7 11.5-7.2 11.5-14.3V7L16 2.5Z" fill="url(#ag-g)" />
      <path
        d="M16 8.2c-3.7 0-6.7 3-6.7 6.7s3 6.7 6.7 6.7 6.7-3 6.7-6.7-3-6.7-6.7-6.7Zm0 0c-1.9 1.8-2.9 4.1-2.9 6.7s1 4.9 2.9 6.7m0-13.4c1.9 1.8 2.9 4.1 2.9 6.7s-1 4.9-2.9 6.7M9.3 14.9h13.4"
        fill="none"
        stroke="#0b0b10"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight">AtlasGuard</span>
    </span>
  );
}
