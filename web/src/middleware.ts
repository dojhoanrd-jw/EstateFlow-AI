import { auth } from '@/backend/features/auth/auth.config';
import { NextResponse } from 'next/server';

const SUPPORTED_LOCALES = ['en', 'es'];
const DEFAULT_LOCALE = 'en';
const COOKIE_NAME = 'NEXT_LOCALE';

function detectLocale(acceptLanguage: string | null): string {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const primary = acceptLanguage.split(',')[0]?.split('-')[0]?.trim().toLowerCase();
  return primary && SUPPORTED_LOCALES.includes(primary) ? primary : DEFAULT_LOCALE;
}

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;

  let response: NextResponse;

  if (!isAuthenticated) {
    const loginUrl = new URL('/login', nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    response = NextResponse.redirect(loginUrl);
  } else {
    response = NextResponse.next();
  }

  // Set locale cookie on first visit
  const localeCookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!localeCookie || !SUPPORTED_LOCALES.includes(localeCookie)) {
    const detected = detectLocale(req.headers.get('accept-language'));
    response.cookies.set(COOKIE_NAME, detected, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }

  return response;
});

export const config = {
  matcher: [
    '/((?!login|api/auth|api/chat|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
