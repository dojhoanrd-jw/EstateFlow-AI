import { APP_ROUTES } from '@/shared/routes/app.routes';

// ============================================
// Navigation item definition
// ============================================

export interface NavItem {
  label: string;
  href: string;
  icon: 'LayoutDashboard' | 'MessageSquare';
}

// ============================================
// App navigation items
// ============================================

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: APP_ROUTES.dashboard,
    icon: 'LayoutDashboard',
  },
  {
    label: 'Conversations',
    href: APP_ROUTES.conversations,
    icon: 'MessageSquare',
  },
];
