import { cn } from '@/lib/utils';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
  primary:     'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 shadow-sm',
  secondary:   'bg-muted text-foreground hover:bg-muted/70 active:scale-95',
  ghost:       'text-muted-foreground hover:bg-[var(--sidebar-hover)] hover:text-foreground active:scale-95',
  destructive: 'bg-destructive text-white hover:bg-destructive/90 active:scale-95',
  outline:     'border border-border bg-transparent hover:bg-muted active:scale-95',
};

const sizes: Record<Size, string> = {
  sm:   'h-8 px-3 text-xs rounded-lg',
  md:   'h-9 px-4 text-sm rounded-xl',
  lg:   'h-11 px-6 text-sm rounded-xl',
  icon: 'h-9 w-9 rounded-full',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        'disabled:pointer-events-none disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
