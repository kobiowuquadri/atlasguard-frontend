import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const cardVariants = cva('relative rounded-xl', {
  variants: {
    variant: {
      default: 'surface border border-border',
      inset: 'border border-border bg-inset',
      featured: 'border-gradient shadow-card',
      dashed: 'border border-dashed border-border-strong bg-transparent',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export function Card({ className, variant, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant }), className)} {...props} />;
}

/** Title block on the left, optional actions on the right. */
export function CardHeader({
  className,
  action,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { action?: React.ReactNode }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 pt-5 pb-4', className)} {...props}>
      <div className="flex min-w-0 flex-col gap-1">{children}</div>
      {action && <div className="flex shrink-0 items-center gap-1.5">{action}</div>}
    </div>
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-[15px] font-semibold tracking-tight text-foreground', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-[13px] leading-relaxed text-muted-foreground', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pb-5', className)} {...props} />;
}
