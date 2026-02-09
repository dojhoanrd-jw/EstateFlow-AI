import { cookies, headers } from 'next/headers';
import { locales, defaultLocale, type Locale } from './config';

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  const headerStore = await headers();
  const acceptLanguage = headerStore.get('accept-language');
  if (acceptLanguage) {
    const primary = acceptLanguage.split(',')[0]?.split('-')[0]?.trim().toLowerCase();
    if (primary && locales.includes(primary as Locale)) {
      return primary as Locale;
    }
  }

  return defaultLocale;
}
