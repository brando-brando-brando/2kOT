import { Trophy, BarChart3, Settings, Play, Zap, Shield, TrendingUp } from 'lucide-react';
import { cn } from '../utils/cn';

interface SidebarProps {
  currentView: 'list' | 'stats' | 'settings';
  onViewChange: (view: 'list' | 'stats' | 'settings') => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const navItems = [
    { id: 'list' as const, icon: Trophy, label: 'Opponents' },
    { id: 'stats' as const, icon: BarChart3, label: 'Statistics' },
    { id: 'settings' as const, icon: Settings, label: 'Settings' },
  ];

  const features = [
    { icon: Zap, label: 'Auto Capture' },
    { icon: Shield, label: 'OCR Detection' },
    { icon: TrendingUp, label: 'Live Analytics' },
  ];

  return (
    <aside className="w-72 bg-background-secondary border-r border-border flex flex-col">
      {/* Brand Identity */}
      <div className="p-6 border-b border-border-muted">
        <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">
          NBA 2K26
        </h1>
        <p className="text-sm text-foreground-secondary font-medium">
          Opponent Tracker
        </p>
        <p className="text-xs text-foreground-secondary opacity-60 mt-1">
          Game Analyzer
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/30 glow-cyan"
                  : "text-foreground-secondary hover:bg-card hover:text-foreground border border-transparent"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-primary" : "group-hover:text-foreground"
              )} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Feature List */}
      <div className="p-4 border-t border-border-muted">
        <p className="text-xs text-foreground-secondary opacity-60 mb-3 uppercase tracking-wider font-semibold">
          Features
        </p>
        <div className="space-y-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.label} className="flex items-center gap-2 text-sm text-foreground-secondary">
                <Icon className="w-4 h-4 text-primary opacity-70" />
                <span>{feature.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Start Capture Button */}
      <div className="p-4 border-t border-border-muted">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-background rounded-xl hover:bg-primary-hover transition-all duration-200 font-semibold glow-cyan">
          <Play className="w-5 h-5" />
          Start Capture
        </button>
      </div>
    </aside>
  );
}
