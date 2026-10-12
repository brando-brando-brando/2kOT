import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Accessible name for the card region */
  label?: string;
}

export function Card({ children, className, label }: CardProps) {
  return (
    <section
      aria-label={label}
      className={cn('glass flex min-w-0 flex-col rounded-card p-4', className)}
    >
      {children}
    </section>
  );
}

interface SectionHeaderProps {
  title: string;
  /** Quiet qualifier shown after the title, e.g. "(captured at start)" */
  note?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, note, icon, action, className }: SectionHeaderProps) {
  return (
    <header className={cn('mb-3 flex min-h-6 items-center justify-between gap-3', className)}>
      <h2 className="flex min-w-0 items-center gap-2 text-[15px] font-semibold leading-tight text-foreground">
        {icon}
        <span className="truncate">{title}</span>
        {note && (
          <span className="truncate text-xs font-normal text-foreground-secondary">{note}</span>
        )}
      </h2>
      {action}
    </header>
  );
}

interface TextActionProps {
  children: ReactNode;
  onClick?: () => void;
}

export function TextAction({ children, onClick }: TextActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded px-1 text-xs font-medium text-primary transition-colors hover:text-primary-hover hover:underline"
    >
      {children}
    </button>
  );
}

interface EmptyStateProps {
  title: string;
  hint?: string;
  className?: string;
}

export function EmptyState({ title, hint, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-4 py-8 text-center', className)}>
      <div className="text-sm font-medium text-foreground-secondary">{title}</div>
      {hint && <div className="mt-1 max-w-xs text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
