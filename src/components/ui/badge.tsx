import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex h-[22px] items-center gap-1 rounded-full px-2 text-[11.5px] leading-none font-medium whitespace-nowrap inset-ring [&_svg]:size-3 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-white/[0.06] text-foreground inset-ring-white/10',
        primary: 'bg-primary-soft text-violet-200 inset-ring-violet-400/25',
        secondary: 'bg-secondary-soft text-cyan-200 inset-ring-cyan-400/25',
        success: 'bg-success-soft text-green-300 inset-ring-green-400/25',
        warning: 'bg-warning-soft text-amber-200 inset-ring-amber-400/25',
        danger: 'bg-danger-soft text-red-300 inset-ring-red-400/25',
        neutral: 'bg-white/[0.05] text-slate-300 inset-ring-white/10',
        outline: 'bg-transparent text-muted-foreground inset-ring-white/12',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
