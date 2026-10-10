import { cn } from '@/lib/utils';

const HUES = ['#8b5cf6', '#7c3aed', '#6d5ae6', '#0891b2', '#5b6ee1'];

/** Deterministic monogram tile so projects are recognisable at a glance. */
export function ProjectMonogram({ name, className }: { name: string; className?: string }) {
  const hue = HUES[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % HUES.length];
  return (
    <span
      aria-hidden
      className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white inset-ring inset-ring-white/15', className)}
      style={{ background: `linear-gradient(135deg, ${hue}, #111318 140%)` }}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
