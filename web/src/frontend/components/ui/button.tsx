'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/frontend/lib/utils';
import { Loader2 } from 'lucide-react';

// ============================================
// Variant + size definitions
// ============================================

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-accent-600)] text-white hover:bg-[var(--color-accent-700)] active:bg-[var(--color-accent-800)] shadow-sm',
  secondary:
    'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border-default)] hover:bg-[var(--color-bg-tertiary)] active:bg-[var(--color-border-default)]',
  ghost:
    'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-border-default)]',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-9 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-6 text-sm gap-2.5 rounded-lg',
};

// ============================================
// Component
// ============================================

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium',
          'transition-colors duration-[var(--transition-fast)]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-border-focus)]',
          'disabled:pointer-events-none disabled:opacity-50',
          'select-none whitespace-nowrap',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Loader2
            className="shrink-0 animate-spin"
            size={size === 'sm' ? 14 : 16}
          />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
