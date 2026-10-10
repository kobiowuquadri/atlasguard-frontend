'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/*
 * AtlasGuard mark — "Orbit A": an A whose crossbar is an orbit, passing in front of the left
 * leg and behind the right. Monochrome (currentColor); same geometry as public/brand/*.svg.
 */
const LEGS = 'M13.75 60 32 17 50.25 60';
const RIGHT_LEG = 'M32 17 50.25 60';
const ORBIT = 'M6.04 41.85A28 6.5-16 0 0 58.91 26.23';

export function LogoMark({ className }: { className?: string }) {
  // Unique ids: several marks can share a page, and a duplicate id in a hidden copy would blank the others.
  const p = `ag${React.useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg viewBox="0 0 64 64" className={cn('size-7', className)} aria-hidden>
      <defs>
        <clipPath id={`${p}-base`}>
          <rect width="64" height="56" />
        </clipPath>
        <clipPath id={`${p}-l`}>
          <rect width="32" height="64" />
        </clipPath>
        <clipPath id={`${p}-r`}>
          <rect x="32" width="32" height="64" />
        </clipPath>
        <mask id={`${p}-legs`} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <rect width="64" height="64" fill="#fff" />
          <path d={ORBIT} fill="none" stroke="#000" strokeWidth="9" clipPath={`url(#${p}-l)`} />
        </mask>
        <mask id={`${p}-orbit`} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <rect width="64" height="64" fill="#fff" />
          <path d={RIGHT_LEG} fill="none" stroke="#000" strokeWidth="11" clipPath={`url(#${p}-r)`} />
        </mask>
      </defs>
      <g clipPath={`url(#${p}-base)`} mask={`url(#${p}-legs)`}>
        <path d={LEGS} fill="none" stroke="currentColor" strokeWidth="7" strokeMiterlimit="10" />
      </g>
      <path d={ORBIT} fill="none" stroke="currentColor" strokeWidth="5" mask={`url(#${p}-orbit)`} />
    </svg>
  );
}

export function Logo({ className, tag }: { className?: string; tag?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark className="size-6 text-foreground" />
      <span className="text-[15px] font-semibold tracking-[-0.025em] text-foreground">AtlasGuard</span>
      {tag && (
        <span className="rounded-full bg-white/[0.05] px-1.5 py-0.5 font-mono text-[9.5px] tracking-[0.08em] text-muted-foreground uppercase inset-ring inset-ring-white/10">
          {tag}
        </span>
      )}
    </span>
  );
}
