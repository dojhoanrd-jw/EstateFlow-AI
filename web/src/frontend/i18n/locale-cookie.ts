import { locales, defaultLocale, type Locale } from './config';

const COOKIE_NAME = 'NEXT_LOCALE';
const MAX_AGE = 60 * 60 * 24 * 365;

export function getLocaleFromCookie(): Locale {
  if (typeof document === 'undefined') return defaultLocale;

  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));

  const value = match?.split('=')[1];
  if (value && locales.includes(value as Locale)) {
    return value as Locale;
  }
  return defaultLocale;
}

export function setLocaleCookie(locale: Locale): void {
  document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
}
