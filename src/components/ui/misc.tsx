'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import { Check, Copy } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse-soft rounded-md bg-elevated', className)} aria-hidden {...props} />;
}

export function Progress({ value, className, label }: { value: number; className?: string; label: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <ProgressPrimitive.Root
      value={clamped}
      aria-label={label}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-elevated', className)}
    >
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-primary transition-[width] duration-500"
        style={{ width: `${clamped}%` }}
      />
    </ProgressPrimitive.Root>
  );
}

export function CopyButton({ value, label = 'Copy', className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-card-hover hover:text-foreground',
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

export function CodeBlock({ code, language, className }: { code: string; language?: string; className?: string }) {
  return (
    <div className={cn('group relative overflow-hidden rounded-md border border-border bg-background-subtle', className)}>
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-[11px] tracking-wide text-subtle-foreground uppercase">{language ?? 'code'}</span>
        <CopyButton value={code} />
      </div>
      <pre className="overflow-x-auto p-3 text-[13px] leading-relaxed text-slate-200">
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
      className={cn('border-b border-border px-3 py-2 text-left text-xs font-medium whitespace-nowrap text-muted-foreground', className)}
      {...props}
    />
  );
}

export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('border-b border-border/60 px-3 py-2.5 align-middle', className)} {...props} />;
}
