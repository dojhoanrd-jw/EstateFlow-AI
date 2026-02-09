'use client';

import { SessionProvider } from 'next-auth/react';
import { SWRProvider } from '@/frontend/components/providers/swr-provider';
import { ToastProvider } from '@/frontend/components/feedback/toast';
import { LocaleProvider } from '@/frontend/i18n/locale-context';
import type { Locale } from '@/frontend/i18n/config';

interface ProvidersProps {
  children: React.ReactNode;
  locale: Locale;
  messages: Record<string, unknown>;
}

export function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <SessionProvider>
      <SWRProvider>
        <LocaleProvider initialLocale={locale} initialMessages={messages}>
          <ToastProvider>{children}</ToastProvider>
        </LocaleProvider>
      </SWRProvider>
    </SessionProvider>
  );
}
