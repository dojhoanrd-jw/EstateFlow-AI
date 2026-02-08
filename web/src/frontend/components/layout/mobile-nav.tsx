'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  MessageSquare,
  X,
  Building2,
  LogOut,
} from 'lucide-react';
import { cn } from '@/frontend/lib/utils';
import { Avatar } from '@/frontend/components/ui/avatar';
import { NAV_ITEMS, type NavItem } from '@/frontend/config/navigation';
import type { UserRole } from '@/shared/types';

// ============================================
// Icon resolver
// ============================================

const iconMap = {
  LayoutDashboard,
  MessageSquare,
} as const;

function NavIcon({ name, className }: { name: NavItem['icon']; className?: string }) {
  const Icon = iconMap[name];
  return <Icon className={className} size={20} />;
}

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
  const { data: session } = useSession();

  const user = session?.user as
    | { name?: string; email?: string; role?: UserRole; image?: string }
    | undefined;

  const userName = user?.name ?? 'User';
  const userRole = user?.role ?? 'agent';
  const userAvatar = user?.image ?? null;

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
        <div className="border-t border-slate-800 p-4">
          <div className="mb-3 flex items-center gap-3">
            <Avatar name={userName} src={userAvatar} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {userName}
              </p>
              <span
                className={cn(
                  'inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  userRole === 'admin'
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'bg-teal-500/15 text-teal-400',
                )}
              >
                {userRole}
              </span>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
