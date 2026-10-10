'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-input bg-inset px-3 text-sm text-foreground shadow-[inset_0_1px_2px_rgb(0_0_0/0.3)] outline-hidden transition-[border-color,box-shadow] hover:border-white/15 focus-visible:border-violet-400/80 focus-visible:ring-4 focus-visible:ring-violet-500/15 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-subtle-foreground [&>span]:truncate',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronsUpDown className="size-3.5 shrink-0 text-subtle-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

export function SelectContent({ className, children, position = 'popper', ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        sideOffset={6}
        className={cn(
          'z-50 max-h-80 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-white/10 bg-[#171a21]/95 shadow-pop backdrop-blur-xl animate-pop-in',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1.5">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

export function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex w-full cursor-pointer items-center rounded-md py-2 pr-8 pl-2.5 text-[13px] outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-white/[0.06] data-[state=checked]:text-foreground',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2.5 flex items-center">
        <Check className="size-3.5 text-violet-300" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
