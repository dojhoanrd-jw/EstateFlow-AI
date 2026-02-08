'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  MessageSquare,
  LogOut,
  Building2,
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
// Sidebar Component
// ============================================

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user as
    | { name?: string; email?: string; role?: UserRole; image?: string }
    | undefined;

  const userName = user?.name ?? 'User';
  const userRole = user?.role ?? 'agent';
  const userAvatar = user?.image ?? null;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-800 bg-slate-900 lg:flex">
      {/* ---- Logo ---- */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600/20">
          <Building2 className="text-teal-400" size={20} />
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">
          Estate<span className="text-teal-400">Flow</span>
        </span>
      </div>

      {/* ---- Navigation ---- */}
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
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
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
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ---- User section ---- */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
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
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors duration-[var(--transition-fast)] hover:bg-slate-800 hover:text-red-400"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
