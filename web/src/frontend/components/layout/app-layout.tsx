'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { Sidebar } from '@/frontend/components/layout/sidebar';
import { Header } from '@/frontend/components/layout/header';
import { MobileNav } from '@/frontend/components/layout/mobile-nav';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleMenuToggle = useCallback(() => {
    setMobileNavOpen((prev) => !prev);
  }, []);

  const handleMobileNavClose = useCallback(() => {
    setMobileNavOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg-secondary)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-[var(--color-accent-600)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
      >
        Skip to content
      </a>

      <Sidebar />

      <Header onMenuToggle={handleMenuToggle} />

      <MobileNav isOpen={mobileNavOpen} onClose={handleMobileNavClose} />

      <main id="main-content" className="pt-14 lg:ml-64 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
