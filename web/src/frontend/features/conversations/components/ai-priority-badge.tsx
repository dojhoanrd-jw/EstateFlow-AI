import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Badge } from '@/frontend/components/ui/badge';
import { cn } from '@/frontend/lib/utils';
import type { ConversationPriority } from '@/shared/types';

interface AIPriorityBadgeProps {
  priority: ConversationPriority;
  className?: string;
}

const priorityConfig: Record<
  ConversationPriority,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    description: string;
  }
> = {
  high: {
    icon: AlertTriangle,
    label: 'High Priority',
    description: 'Requires immediate attention',
  },
  medium: {
    icon: Clock,
    label: 'Medium Priority',
    description: 'Follow up within 24 hours',
  },
  low: {
    icon: CheckCircle,
    label: 'Low Priority',
    description: 'Can be addressed at regular pace',
  },
};

export function AIPriorityBadge({ priority, className }: AIPriorityBadgeProps) {
  const config = priorityConfig[priority];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg p-3',
        'bg-[var(--color-bg-primary)]',
        'border border-[var(--color-border-subtle)]',
        className,
      )}
    >
      <Badge variant="priority" level={priority} className="gap-1 px-2.5 py-1 text-xs">
        <Icon size={12} />
        {config.label}
      </Badge>
      <span className="text-[10px] text-[var(--color-text-tertiary)]">
        {config.description}
      </span>
    </div>
  );
}
