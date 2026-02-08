import { auth } from '@/backend/features/auth/auth.config';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;

  if (!isAuthenticated) {
    const loginUrl = new URL('/login', nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!login|api/auth|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
