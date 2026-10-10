import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3.5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'border-border bg-elevated text-foreground',
        primary: 'border-primary/30 bg-primary-soft text-violet-200',
        secondary: 'border-secondary/30 bg-secondary-soft text-cyan-200',
        success: 'border-success/30 bg-success-soft text-green-300',
        warning: 'border-warning/30 bg-warning-soft text-amber-200',
        danger: 'border-danger/30 bg-danger-soft text-red-300',
        neutral: 'border-border-strong bg-neutral-soft text-slate-300',
        outline: 'border-border-strong text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
