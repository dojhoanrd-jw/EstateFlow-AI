'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { Sidebar } from '@/frontend/components/layout/sidebar';
import { Header } from '@/frontend/components/layout/header';
import { MobileNav } from '@/frontend/components/layout/mobile-nav';

// ============================================
// App Layout Props
// ============================================

interface AppLayoutProps {
  children: ReactNode;
}

// ============================================
// App Layout Component
// ============================================

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
      {/* ---- Desktop sidebar ---- */}
      <Sidebar />

      {/* ---- Mobile header ---- */}
      <Header onMenuToggle={handleMenuToggle} />

      {/* ---- Mobile navigation overlay ---- */}
      <MobileNav isOpen={mobileNavOpen} onClose={handleMobileNavClose} />

      {/* ---- Main content area ---- */}
      <main className="pt-14 lg:ml-64 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
