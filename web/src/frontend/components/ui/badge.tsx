import { cn, getPriorityColor, getTagColor } from '@/frontend/lib/utils';
import type { ConversationPriority } from '@/shared/types';

type BadgeVariant = 'default' | 'priority' | 'tag';

interface BadgeBaseProps {
  className?: string;
  children: React.ReactNode;
}

interface BadgeDefaultProps extends BadgeBaseProps {
  variant?: 'default';
}

interface BadgePriorityProps extends BadgeBaseProps {
  variant: 'priority';
  level: ConversationPriority;
}

interface BadgeTagProps extends BadgeBaseProps {
  variant: 'tag';
  tag: string;
}

type BadgeProps = BadgeDefaultProps | BadgePriorityProps | BadgeTagProps;

export function Badge(props: BadgeProps) {
  const { className, children } = props;
  const variant: BadgeVariant = props.variant ?? 'default';

  let variantClasses = '';

  if (variant === 'priority') {
    variantClasses = getPriorityColor((props as BadgePriorityProps).level);
  } else if (variant === 'tag') {
    variantClasses = getTagColor((props as BadgeTagProps).tag);
  } else {
    variantClasses =
      'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)]';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5',
        'text-xs font-medium leading-none whitespace-nowrap',
        variantClasses,
        className,
      )}
    >
      {children}
    </span>
  );
}
