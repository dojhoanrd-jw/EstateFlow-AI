'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/shared/routes/app.routes';
import type { UserRole } from '@/shared/types';

// ============================================
// Typed session user
// ============================================

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  image: string | null;
}

// ============================================
// useCurrentUser
// Returns typed user data from the active session.
// Returns null while loading or when unauthenticated.
// ============================================

export function useCurrentUser() {
  const { data: session, status } = useSession();

  const user = session?.user
    ? ({
        id: session.user.id,
        name: session.user.name ?? '',
        email: session.user.email ?? '',
        role: session.user.role ?? 'agent',
        image: session.user.image ?? null,
      } satisfies SessionUser)
    : null;

  return {
    user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  };
}

// ============================================
// useRequireAuth
// Redirects to the login page if the user
// is not authenticated. Use in protected pages.
// ============================================

export function useRequireAuth() {
  const { user, isLoading, isAuthenticated } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(APP_ROUTES.login);
    }
  }, [isLoading, isAuthenticated, router]);

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}
