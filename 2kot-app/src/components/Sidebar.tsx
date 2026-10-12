import { BarChart3, Check, Crosshair, LayoutDashboard, Play, Settings, Users } from 'lucide-react';
import { cn } from '../utils/cn';
import type { AppView, CaptureState } from '../types/dashboard';
import { StatusIndicator } from './ui/StatusIndicator';

const navItems: { id: AppView; icon: typeof LayoutDashboard; label: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'opponents', icon: Users, label: 'Opponents' },
  { id: 'stats', icon: BarChart3, label: 'Statistics' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  features: string[];
  captureState: CaptureState;
  /** Capture is not wired up yet; the button stays disabled until this is provided */
  onStartCapture?: () => void;
}

export function Sidebar({ currentView, onViewChange, features, captureState, onStartCapture }: SidebarProps) {
  return (
    <aside className="flex w-16 shrink-0 flex-col border-r border-border-soft bg-background-secondary/70 backdrop-blur-xl lg:w-60">
      {/* Product identity */}
      <div className="flex h-14 items-center gap-3 border-b border-border-muted px-3 lg:px-4">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-gradient-to-br from-primary/25 to-secondary/30 text-primary shadow-[0_0_16px_-4px_var(--primary)]"
        >
          <Crosshair className="size-5" />
        </span>
        <div className="hidden min-w-0 lg:block">
          <div className="truncate text-sm font-bold leading-tight text-foreground">
            NBA 2K26 <span className="font-semibold text-primary">Opponent Tracker</span>
          </div>
          <div className="eyebrow mt-0.5">Game Analyzer</div>
        </div>
        <span className="sr-only lg:hidden">NBA 2K26 Opponent Tracker, Game Analyzer</span>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto p-2 lg:p-3">
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = currentView === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onViewChange(id)}
              aria-current={isActive ? 'page' : undefined}
              title={label}
              className={cn(
                'relative flex w-full items-center justify-center gap-3 rounded-lg border px-3 py-2 text-sm font-medium transition-colors lg:justify-start',
                isActive
                  ? 'border-primary/30 bg-primary/10 text-primary'
                  : 'border-transparent text-foreground-secondary hover:bg-white/5 hover:text-foreground',
              )}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]"
                />
              )}
              <Icon className="size-[18px] shrink-0" aria-hidden="true" />
              <span className="hidden lg:inline">{label}</span>
            </button>
          );
        })}

        <div className="hidden pt-5 lg:block">
          <div className="eyebrow px-3 pb-2">Features</div>
          <ul className="space-y-1.5 px-3 text-xs text-foreground-secondary">
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check className="size-3.5 shrink-0 text-primary/80" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Capture status */}
      <div className="space-y-3 border-t border-border-muted p-2 lg:p-3">
        <div className="hidden items-center justify-between px-1 lg:flex">
          <span className="eyebrow">Capture</span>
          <StatusIndicator state={captureState} />
        </div>
        <button
          type="button"
          onClick={onStartCapture}
          disabled={!onStartCapture}
          title={onStartCapture ? 'Start capture' : 'Capture is not connected yet'}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/15 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/25 disabled:border-border-muted disabled:bg-white/5 disabled:text-muted-foreground"
        >
          <Play className="size-4 shrink-0" aria-hidden="true" />
          <span className="hidden lg:inline">Start Capture</span>
          <span className="sr-only lg:hidden">Start Capture</span>
        </button>
      </div>
    </aside>
  );
}
