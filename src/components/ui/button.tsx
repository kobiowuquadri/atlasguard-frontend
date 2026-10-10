import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap select-none transition-[background-color,background-image,box-shadow,color,opacity] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Lit from above: a soft violet gradient, a crisp 1px edge and a faint glow.
        default:
          'bg-[linear-gradient(180deg,#8f63f8_0%,#7c3aed_100%)] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_0_0_1px_rgb(109_40_217/0.95),0_2px_10px_-3px_rgb(124_58_237/0.6)] hover:bg-[linear-gradient(180deg,#9c75fa_0%,#8646f1_100%)] hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.26),0_0_0_1px_rgb(124_58_237),0_6px_20px_-6px_rgb(124_58_237/0.75)]',
        secondary:
          'bg-white/[0.045] text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.05),0_0_0_1px_rgb(255_255_255/0.09)] hover:bg-white/[0.08]',
        outline: 'text-foreground shadow-[0_0_0_1px_rgb(255_255_255/0.14)] hover:bg-white/[0.05]',
        ghost: 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground',
        destructive:
          'bg-[#dc2626] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_0_0_1px_rgb(185_28_28)] hover:bg-[#e23b3b]',
        link: 'rounded-sm text-violet-text underline-offset-4 hover:underline active:translate-y-0',
      },
      size: {
        xs: 'h-7 rounded-md px-2.5 text-xs [&_svg]:size-3.5',
        sm: 'h-8 rounded-md px-3 text-[13px]',
        md: 'h-9 px-4',
        lg: 'h-11 px-5 text-[15px]',
        icon: 'size-9',
        'icon-sm': 'size-8 rounded-md',
      },
    },
    compoundVariants: [{ variant: 'link', className: 'h-auto px-0' }],
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <LoaderCircle className="animate-spin" aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  );
}
