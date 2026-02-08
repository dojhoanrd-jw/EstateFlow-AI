import { Tags } from 'lucide-react';
import { Badge } from '@/frontend/components/ui/badge';
import { cn } from '@/frontend/lib/utils';

// ============================================
// Types
// ============================================

interface AITagsProps {
  tags: string[];
  className?: string;
}

// ============================================
// Component
// ============================================

export function AITags({ tags, className }: AITagsProps) {
  if (tags.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      <div className="flex items-center gap-1.5 px-1">
        <Tags size={12} className="text-[var(--color-text-tertiary)]" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
          AI Tags
        </span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="tag" tag={tag}>
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}
