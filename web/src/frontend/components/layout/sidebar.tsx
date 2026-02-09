'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Building2 } from 'lucide-react';
import { cn } from '@/frontend/lib/utils';
import { NavIcon } from '@/frontend/components/layout/nav-icon';
import { NAV_ITEMS } from '@/frontend/config/navigation';
import { UserSection } from '@/frontend/components/layout/user-section';
import { LanguageSwitcher } from '@/frontend/components/ui/language-switcher';

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-800 bg-slate-900 lg:flex">
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600/20">
          <Building2 className="text-teal-400" size={20} />
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">
          Estate<span className="text-teal-400">Flow</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {t('menu')}
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
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
              {t(item.labelKey)}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <LanguageSwitcher variant="sidebar" />
      <UserSection variant="sidebar" />
    </aside>
  );
}
