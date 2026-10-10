'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import { Check, Copy } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('skeleton rounded-md', className)} aria-hidden {...props} />;
}

export function Progress({
  value,
  className,
  label,
  active = false,
}: {
  value: number;
  className?: string;
  label: string;
  /** Animated stripes while work is in flight. */
  active?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <ProgressPrimitive.Root
      value={clamped}
      aria-label={label}
      className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]', className)}
    >
      <ProgressPrimitive.Indicator
        className={cn('h-full rounded-full bg-brand transition-[width] duration-700 ease-out', active && 'progress-stripes')}
        style={{ width: `${clamped}%` }}
      />
    </ProgressPrimitive.Root>
  );
}

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-white/10 bg-white/[0.04] px-1 font-mono text-[10.5px] leading-none text-muted-foreground shadow-[inset_0_-1px_0_rgb(255_255_255/0.06)]',
        className,
      )}
      {...props}
    />
  );
}

export function CopyButton({ value, label = 'Copy', className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground',
        className,
      )}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      aria-label={copied ? 'Copied' : label}
    >
      {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      {copied ? 'Copied' : label}
    </button>
  );
}

/** Code panel with editor-style chrome: traffic lights, a filename/language tab and copy. */
export function CodeBlock({ code, language, title, className }: { code: string; language?: string; title?: string; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-inset shadow-card', className)}>
      <div className="flex items-center gap-3 border-b border-border bg-white/[0.02] px-3 py-2">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-white/10" />
          <span className="size-2.5 rounded-full bg-white/10" />
          <span className="size-2.5 rounded-full bg-white/10" />
        </span>
        <span className="truncate font-mono text-[11.5px] text-muted-foreground">{title ?? language ?? 'code'}</span>
        <CopyButton value={code} className="ml-auto" />
      </div>
      <pre className="overflow-x-auto p-4 text-[12.5px] leading-[1.7] text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm', className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        'h-9 border-b border-border px-3 text-left text-[11px] font-medium tracking-[0.06em] whitespace-nowrap text-subtle-foreground uppercase',
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('border-b border-border px-3 py-3 align-middle', className)} {...props} />;
}

/** Segmented control for small, mutually exclusive filters. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: React.ReactNode; count?: number }>;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg bg-white/[0.03] p-1 inset-ring inset-ring-white/[0.07]', className)}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium whitespace-nowrap transition-colors',
              selected
                ? 'bg-white/[0.08] text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_1px_2px_rgb(0_0_0/0.3)]'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {o.label}
            {o.count !== undefined && <span className={cn('tabular text-[11px]', selected ? 'text-muted-foreground' : 'text-subtle-foreground')}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
