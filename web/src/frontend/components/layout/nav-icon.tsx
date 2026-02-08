import { LayoutDashboard, MessageSquare } from 'lucide-react';
import type { NavItem } from '@/frontend/config/navigation';

const iconMap = {
  LayoutDashboard,
  MessageSquare,
} as const;

export function NavIcon({ name, className }: { name: NavItem['icon']; className?: string }) {
  const Icon = iconMap[name];
  return <Icon className={className} size={20} />;
}
