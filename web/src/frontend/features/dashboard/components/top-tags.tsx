import { Tags } from 'lucide-react';
import { cn, getTagColor } from '@/frontend/lib/utils';
import { Card, CardHeader, CardTitle, CardBody } from '@/frontend/components/ui/card';

interface TagData {
  tag: string;
  count: number;
}

interface TopTagsProps {
  tags: TagData[];
  className?: string;
}

export function TopTags({ tags, className }: TopTagsProps) {
  const maxCount = tags.length > 0 ? Math.max(...tags.map((t) => t.count)) : 1;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Tags size={16} className="text-[var(--color-text-tertiary)]" />
          <CardTitle>Top AI Tags</CardTitle>
        </div>
      </CardHeader>

      <CardBody className="space-y-3">
        {tags.map((item, index) => {
          const barWidth = Math.max((item.count / maxCount) * 100, 8);
          const colorClasses = getTagColor(item.tag);

          return (
            <div key={item.tag} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--color-text-tertiary)] tabular-nums w-4">
                    {index + 1}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5',
                      'text-xs font-medium leading-none',
                      colorClasses,
                    )}
                  >
                    {item.tag}
                  </span>
                </div>
                <span className="text-xs font-semibold text-[var(--color-text-secondary)] tabular-nums">
                  {item.count}
                </span>
              </div>

              <div className="ml-6 h-1.5 w-auto overflow-hidden rounded-full bg-[var(--color-bg-tertiary)]">
                <div
                  className="h-full rounded-full bg-[var(--color-text-tertiary)]/30 transition-all duration-700 ease-out"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}

        {tags.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Tags size={24} className="text-[var(--color-text-tertiary)] mb-2" />
            <p className="text-sm text-[var(--color-text-tertiary)]">
              No tags available yet
            </p>
          </div>
        )}

        {tags.length > 0 && (
          <div className="pt-3 border-t border-[var(--color-border-subtle)]">
            <div className="flex flex-wrap gap-1.5">
              {tags.map((item) => (
                <span
                  key={item.tag}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
                    'text-[10px] font-medium leading-none',
                    getTagColor(item.tag),
                  )}
                >
                  {item.tag}
                  <span className="opacity-60">{item.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
