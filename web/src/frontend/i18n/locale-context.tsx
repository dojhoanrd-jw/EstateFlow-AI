'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { type Locale, defaultLocale, locales } from './config';
import { setLocaleCookie } from './locale-cookie';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: defaultLocale,
  setLocale: () => {},
});

export function useLocale() {
  return useContext(LocaleContext);
}

const messageCache: Partial<Record<Locale, Record<string, unknown>>> = {};

async function loadMessages(locale: Locale) {
  if (messageCache[locale]) return messageCache[locale]!;
  const msgs = (await import(`./messages/${locale}.json`)).default;
  messageCache[locale] = msgs;
  return msgs;
}

interface LocaleProviderProps {
  initialLocale: Locale;
  initialMessages: Record<string, unknown>;
  children: ReactNode;
}

export function LocaleProvider({
  initialLocale,
  initialMessages,
  children,
}: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    messageCache[initialLocale] = initialMessages;
  }, [initialLocale, initialMessages]);

  // Pre-load the other locale for instant switching
  useEffect(() => {
    locales
      .filter((l) => l !== locale)
      .forEach((l) => loadMessages(l));
  }, [locale]);

  const setLocale = useCallback(async (newLocale: Locale) => {
    const msgs = await loadMessages(newLocale);
    setLocaleCookie(newLocale);
    setMessages(msgs);
    setLocaleState(newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}
