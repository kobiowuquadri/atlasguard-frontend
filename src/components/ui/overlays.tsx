'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { X } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------- Dialog */

export const Dialog = DialogPrimitive.Root;

export function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm animate-fade-in" />
      <DialogPrimitive.Content
        className={cn(
          'fixed top-1/2 left-1/2 z-50 grid max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto rounded-2xl border border-white/10 bg-[#13151b] p-6 shadow-pop animate-pop-in',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute top-4 right-4 flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 pr-8', className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn('text-lg font-semibold tracking-tight', className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn('text-sm leading-relaxed text-muted-foreground', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end', className)} {...props} />;
}

/* -------------------------------------------------------- DropdownMenu */

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export function DropdownMenuContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={sideOffset}
        className={cn('z-50 min-w-52 rounded-xl border border-white/10 bg-[#171a21]/95 p-1.5 shadow-pop backdrop-blur-xl animate-pop-in', className)}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }: React.ComponentProps<typeof DropdownPrimitive.Item>) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-white/[0.06] [&_svg]:size-4 [&_svg]:text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof DropdownPrimitive.Label>) {
  return <DropdownPrimitive.Label className={cn('px-2 py-1.5 text-xs text-muted-foreground', className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof DropdownPrimitive.Separator>) {
  return <DropdownPrimitive.Separator className={cn('-mx-1.5 my-1.5 h-px bg-border', className)} {...props} />;
}

/* ---------------------------------------------------------------- Tabs */

type TabsVariant = 'underline' | 'pill';
const TabsVariantContext = React.createContext<TabsVariant>('underline');

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, variant = 'underline', ...props }: React.ComponentProps<typeof TabsPrimitive.List> & { variant?: TabsVariant }) {
  return (
    <TabsVariantContext.Provider value={variant}>
      <TabsPrimitive.List
        className={cn(
          variant === 'underline'
            ? 'flex max-w-full items-center gap-6 overflow-x-auto border-b border-border'
            : 'inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-white/[0.03] p-1 inset-ring inset-ring-white/[0.07]',
          className,
        )}
        {...props}
      />
    </TabsVariantContext.Provider>
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex cursor-pointer items-center gap-2 font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground data-[state=active]:text-foreground [&_svg]:size-4',
        variant === 'underline'
          ? 'relative -mb-px border-b-2 border-transparent pt-1 pb-3 text-sm data-[state=active]:border-violet-400'
          : 'h-7 rounded-md px-3 text-[13px] data-[state=active]:bg-white/[0.08] data-[state=active]:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_1px_2px_rgb(0_0_0/0.3)]',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('mt-6 animate-fade-in outline-hidden', className)} {...props} />;
}

/* ------------------------------------------------------------- Tooltip */

export const TooltipProvider = TooltipPrimitive.Provider;

export function Tooltip({ content, children, side = 'top' }: { content: React.ReactNode; children: React.ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <TooltipPrimitive.Root delayDuration={150}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className="z-50 max-w-xs rounded-lg border border-white/10 bg-[#1c1f28] px-2.5 py-1.5 text-xs leading-relaxed text-foreground shadow-pop animate-fade-in"
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
