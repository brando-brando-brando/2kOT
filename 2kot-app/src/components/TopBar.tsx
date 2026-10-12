import { FlaskConical, Settings } from 'lucide-react';
import type { CaptureState } from '../types/dashboard';
import { StatusIndicator } from './ui/StatusIndicator';

interface TopBarProps {
  title: string;
  subtitle?: string;
  captureState: CaptureState;
  /** Shows a badge making clear the dashboard is filled with sample data */
  showSampleBadge?: boolean;
  onOpenSettings?: () => void;
}

export function TopBar({ title, subtitle, captureState, showSampleBadge, onOpenSettings }: TopBarProps) {
  const isCapturing = captureState === 'recording' || captureState === 'processing';

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border-soft bg-background-secondary/50 px-4 backdrop-blur-xl sm:px-6">
      <div className="flex min-w-0 items-baseline gap-3">
        <h1 className="truncate text-base font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="hidden truncate text-xs text-foreground-secondary md:block">{subtitle}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-4">
        {showSampleBadge && (
          <span
            title="Nothing has been tracked yet, so the dashboard is showing sample data"
            className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-warning"
          >
            <FlaskConical className="size-3" aria-hidden="true" />
            Sample data
          </span>
        )}
        <div className="hidden items-center gap-4 sm:flex">
          <StatusIndicator
            state={captureState === 'disconnected' ? 'disconnected' : 'connected'}
            label={captureState === 'disconnected' ? 'Capture not connected' : 'Capture connected'}
          />
          <StatusIndicator state={isCapturing ? captureState : 'idle'} />
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open settings"
          className="rounded-lg p-2 text-foreground-secondary transition-colors hover:bg-white/5 hover:text-foreground"
        >
          <Settings className="size-[18px]" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
