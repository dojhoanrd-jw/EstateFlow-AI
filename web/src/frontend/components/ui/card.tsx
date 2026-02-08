import { cn } from '@/frontend/lib/utils';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--color-border-default)]',
        'bg-[var(--color-bg-elevated)] shadow-[var(--shadow-sm)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export function CardHeader({ className, children }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-6 py-4',
        'border-b border-[var(--color-border-subtle)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface CardTitleProps {
  className?: string;
  children: React.ReactNode;
}

export function CardTitle({ className, children }: CardTitleProps) {
  return (
    <h3
      className={cn(
        'text-base font-semibold text-[var(--color-text-primary)]',
        className,
      )}
    >
      {children}
    </h3>
  );
}

interface CardBodyProps {
  className?: string;
  children: React.ReactNode;
}

export function CardBody({ className, children }: CardBodyProps) {
  return <div className={cn('px-6 py-4', className)}>{children}</div>;
}

interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

export function CardFooter({ className, children }: CardFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center px-6 py-4',
        'border-t border-[var(--color-border-subtle)]',
        className,
      )}
    >
      {children}
    </div>
  );
}
