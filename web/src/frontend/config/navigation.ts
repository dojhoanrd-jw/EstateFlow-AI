import { APP_ROUTES } from '@/shared/routes/app.routes';

export interface NavItem {
  labelKey: string;
  href: string;
  icon: 'LayoutDashboard' | 'MessageSquare';
}

export const NAV_ITEMS: NavItem[] = [
  {
    labelKey: 'dashboard',
    href: APP_ROUTES.dashboard,
    icon: 'LayoutDashboard',
  },
  {
    labelKey: 'conversations',
    href: APP_ROUTES.conversations,
    icon: 'MessageSquare',
  },
];
