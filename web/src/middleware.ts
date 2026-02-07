import { auth } from '@/backend/features/auth/auth.config';
import { NextResponse } from 'next/server';

/**
 * NextAuth v5 middleware.
 *
 * - All routes matched by `config.matcher` go through this function.
 * - Unauthenticated users are redirected to /login.
 * - Public paths (/login, /api/auth/*) are excluded via the matcher so they
 *   never reach this guard.
 */
export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;

  // If the user is not authenticated, redirect to the login page.
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated -- continue normally.
  return NextResponse.next();
});

/**
 * Matcher configuration.
 *
 * Protect everything EXCEPT:
 *   - /login              (public auth page)
 *   - /api/auth/*         (NextAuth API routes)
 *   - /_next/*            (Next.js internals)
 *   - /favicon.ico, etc.  (static assets)
 */
export const config = {
  matcher: [
    '/((?!login|api/auth|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
