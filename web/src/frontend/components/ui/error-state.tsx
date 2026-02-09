'use client';

import { useTranslations } from 'next-intl';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/frontend/lib/utils';

interface ErrorStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title, description, onRetry, className }: ErrorStateProps) {
  const t = useTranslations('common');

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
          <AlertCircle size={24} className="text-red-500" />
        </div>
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
          {title}
        </h3>
        <p className="text-sm text-[var(--color-text-tertiary)] max-w-xs mx-auto">
          {description}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent-600)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-accent-700)] transition-colors"
          >
            <RefreshCw size={14} />
            {t('retry')}
          </button>
        )}
      </div>
    </div>
  );
}
