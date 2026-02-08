'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/frontend/lib/utils';
import { ChevronDown } from 'lucide-react';

// ============================================
// Types
// ============================================

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

// ============================================
// Component
// ============================================

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, label, error, hint, options, placeholder, id, ...props },
    ref,
  ) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-[var(--color-text-primary)]"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'h-10 w-full appearance-none rounded-lg border pl-3 pr-9 text-sm',
              'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]',
              'transition-colors duration-[var(--transition-fast)]',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              hasError
                ? 'border-red-500 focus:ring-red-500/25'
                : 'border-[var(--color-border-default)] focus:border-[var(--color-border-focus)] focus:ring-[var(--color-accent-500)]/25',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className,
            )}
            aria-invalid={hasError}
            aria-describedby={
              hasError
                ? `${selectId}-error`
                : hint
                  ? `${selectId}-hint`
                  : undefined
            }
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>

          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
            size={16}
          />
        </div>

        {error && (
          <p
            id={`${selectId}-error`}
            className="text-xs text-red-500"
            role="alert"
          >
            {error}
          </p>
        )}

        {!error && hint && (
          <p
            id={`${selectId}-hint`}
            className="text-xs text-[var(--color-text-tertiary)]"
          >
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
