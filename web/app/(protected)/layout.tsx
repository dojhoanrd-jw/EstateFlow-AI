'use client';

import { useRequireAuth } from '@/frontend/features/auth/hooks/use-auth';
import { AppLayout } from '@/frontend/components/layout/app-layout';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useRequireAuth();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-accent-600)] border-t-transparent" />
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
