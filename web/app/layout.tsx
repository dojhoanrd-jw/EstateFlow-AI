import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/frontend/components/providers/providers';
import { getRequestLocale } from '@/frontend/i18n/get-locale';
import { getMessages } from '@/frontend/i18n/get-messages';
import '@/frontend/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EstateFlow AI',
  description: 'AI-powered real estate platform',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getRequestLocale();
  const messages = await getMessages(locale);

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
