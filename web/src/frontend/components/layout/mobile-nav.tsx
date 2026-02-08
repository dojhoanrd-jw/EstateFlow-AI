'use client';

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Building2 } from 'lucide-react';
import { cn } from '@/frontend/lib/utils';
import { NavIcon } from '@/frontend/components/layout/nav-icon';
import { NAV_ITEMS } from '@/frontend/config/navigation';
import { UserSection } from '@/frontend/components/layout/user-section';

// ============================================
// Mobile Nav Props
// ============================================

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

// ============================================
// Mobile Navigation Component
// ============================================

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close nav when route changes
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key to close + focus trap
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a, button, input, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [isOpen, onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* ---- Backdrop overlay ---- */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          isOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ---- Slide-in panel ---- */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 shadow-2xl transition-transform duration-300 ease-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* ---- Header with logo + close ---- */}
        <div className="flex h-14 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600/20">
              <Building2 className="text-teal-400" size={18} />
            </div>
            <span className="text-base font-semibold tracking-tight text-white">
              Estate<span className="text-teal-400">Flow</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* ---- Navigation links ---- */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Menu
          </p>
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium',
                  'transition-all duration-[var(--transition-fast)]',
                  isActive
                    ? 'bg-teal-600/15 text-teal-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                )}
              >
                <NavIcon
                  name={item.icon}
                  className={cn(
                    'shrink-0 transition-colors duration-[var(--transition-fast)]',
                    isActive
                      ? 'text-teal-400'
                      : 'text-slate-500 group-hover:text-slate-300',
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* ---- User section ---- */}
        <UserSection variant="mobile" />
      </div>
    </>
  );
}
