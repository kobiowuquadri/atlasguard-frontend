'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { Check } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

/** Recessed field: darker than the card it sits on, violet edge + soft halo on focus. */
const fieldBase =
  'w-full rounded-lg border border-input bg-inset px-3 text-sm text-foreground shadow-[inset_0_1px_2px_rgb(0_0_0/0.3)] outline-hidden transition-[border-color,box-shadow] duration-150 placeholder:text-subtle-foreground hover:border-white/15 focus-visible:border-violet-400/80 focus-visible:ring-4 focus-visible:ring-violet-500/15 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-red-400/70 aria-[invalid=true]:focus-visible:ring-red-500/15';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, 'h-10', className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, 'min-h-24 py-2.5 leading-relaxed', className)} {...props} />;
}

export function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return <LabelPrimitive.Root className={cn('text-[13px] font-medium text-slate-200', className)} {...props} />;
}

export function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'peer size-[18px] shrink-0 cursor-pointer rounded-[5px] border border-white/20 bg-inset transition-colors hover:border-white/30 data-[state=checked]:border-violet-400 data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
        <Check className="size-3" strokeWidth={3.25} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-white/12 inset-ring inset-ring-white/10 transition-colors data-[state=checked]:bg-primary data-[state=checked]:inset-ring-violet-300/30 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-4 translate-x-0.5 rounded-full bg-white shadow-[0_1px_3px_rgb(0_0_0/0.4)] transition-transform data-[state=checked]:translate-x-[18px]" />
    </SwitchPrimitive.Root>
  );
}

/** Label + control + hint/error, wired for accessibility. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  aside,
  children,
  className,
}: {
  label: React.ReactNode;
  htmlFor: string;
  hint?: React.ReactNode;
  error?: string;
  /** Right-aligned content on the label row (e.g. a link or character count). */
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {aside}
      </div>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-red-300">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
