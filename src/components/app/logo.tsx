'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/** AtlasGuard mark: a shield whose inner arcs read as a globe's meridians. */
export function LogoMark({ className }: { className?: string }) {
  // Unique gradient ids: a duplicate id inside a hidden copy of the logo would blank the others.
  const id = `ag${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg viewBox="0 0 32 32" className={cn('size-7', className)} aria-hidden>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="0.5" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M16 2.5 4.5 7v8.2c0 7.1 4.9 12.6 11.5 14.3 6.6-1.7 11.5-7.2 11.5-14.3V7L16 2.5Z" fill={`url(#${id}-g)`} />
      <path d="M16 2.5 4.5 7v8.2c0 7.1 4.9 12.6 11.5 14.3 6.6-1.7 11.5-7.2 11.5-14.3V7L16 2.5Z" fill={`url(#${id}-s)`} />
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

export function Logo({ className, tag }: { className?: string; tag?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-[-0.01em]">AtlasGuard</span>
      {tag && (
        <span className="rounded-full bg-white/[0.05] px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.08em] text-muted-foreground uppercase inset-ring inset-ring-white/10">
          {tag}
        </span>
      )}
    </span>
  );
}
