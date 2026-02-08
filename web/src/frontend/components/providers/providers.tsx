'use client';

import { SessionProvider } from 'next-auth/react';
import { SWRProvider } from '@/frontend/components/providers/swr-provider';
import { ToastProvider } from '@/frontend/components/feedback/toast';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <SWRProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </SWRProvider>
    </SessionProvider>
  );
}
