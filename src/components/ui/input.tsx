import { cn } from '@/lib/utils';
import { type InputHTMLAttributes, forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-xl border-0 bg-[var(--input)] px-4 py-2 text-sm text-foreground',
        'placeholder:text-muted-foreground/70',
        'transition-shadow duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
