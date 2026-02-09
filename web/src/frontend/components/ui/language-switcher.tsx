'use client';

import { useLocale } from '@/frontend/i18n/locale-context';
import { locales } from '@/frontend/i18n/config';
import { cn } from '@/frontend/lib/utils';

interface LanguageSwitcherProps {
  variant?: 'login' | 'sidebar';
}

export function LanguageSwitcher({ variant = 'sidebar' }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();

  if (variant === 'login') {
    return (
      <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-1">
        {locales.map((l) => (
          <button
            key={l}
            onClick={() => setLocale(l)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              locale === l
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-3 mb-2 flex items-center rounded-lg bg-slate-800/60 p-1">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={cn(
            'flex flex-1 items-center justify-center rounded-md px-3 py-1.5 text-xs font-semibold tracking-wide transition-all',
            locale === l
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white',
          )}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
