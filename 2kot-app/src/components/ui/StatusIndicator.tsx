import { cn } from '../../utils/cn';
import type { CaptureState } from '../../types/dashboard';

const stateStyles: Record<CaptureState, { dot: string; label: string; pulse: boolean }> = {
  connected: { dot: 'bg-success shadow-[0_0_8px_var(--success)]', label: 'Connected', pulse: false },
  recording: { dot: 'bg-destructive shadow-[0_0_8px_var(--destructive)]', label: 'Recording', pulse: true },
  processing: { dot: 'bg-primary shadow-[0_0_8px_var(--primary)]', label: 'Processing', pulse: true },
  idle: { dot: 'bg-muted-foreground', label: 'Idle', pulse: false },
  disconnected: { dot: 'border border-muted-foreground bg-transparent', label: 'Not connected', pulse: false },
};

interface StatusIndicatorProps {
  state: CaptureState;
  /** Overrides the default label for the state */
  label?: string;
  className?: string;
}

export function StatusIndicator({ state, label, className }: StatusIndicatorProps) {
  const style = stateStyles[state];

  return (
    <span
      role="status"
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-foreground-secondary',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn('size-2 rounded-full', style.dot, style.pulse && 'motion-safe:animate-pulse')}
      />
      {label ?? style.label}
    </span>
  );
}
