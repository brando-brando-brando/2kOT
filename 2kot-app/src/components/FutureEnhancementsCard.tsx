import { Sparkles, Eye, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';

interface Enhancement {
  icon: React.ReactNode;
  label: string;
  status: 'planned' | 'in-progress' | 'coming-soon';
}

const enhancements: Enhancement[] = [
  {
    icon: <Eye className="w-4 h-4" />,
    label: 'Improved Opponent Recognition',
    status: 'in-progress',
  },
  {
    icon: <TrendingUp className="w-4 h-4" />,
    label: 'Matchup Insights',
    status: 'planned',
  },
  {
    icon: <AlertCircle className="w-4 h-4" />,
    label: 'Streak Alerts',
    status: 'planned',
  },
  {
    icon: <Sparkles className="w-4 h-4" />,
    label: 'Advanced Statistics',
    status: 'coming-soon',
  },
];

export function FutureEnhancementsCard() {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-magenta" />
        <h2 className="text-lg font-semibold text-foreground">Future Enhancements</h2>
      </div>

      <div className="space-y-3">
        {enhancements.map((enhancement, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 rounded-xl bg-background-secondary/30"
          >
            <div className="p-2 rounded-lg bg-background-secondary border border-border-muted">
              <div className="text-primary">{enhancement.icon}</div>
            </div>
            <div className="flex-1">
              <div className="text-sm text-foreground font-medium">{enhancement.label}</div>
            </div>
            <div
              className={cn(
                "px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wider",
                enhancement.status === 'in-progress'
                  ? "bg-primary/20 text-primary"
                  : enhancement.status === 'planned'
                  ? "bg-magenta/20 text-magenta"
                  : "bg-foreground-secondary/20 text-foreground-secondary"
              )}
            >
              {enhancement.status.replace('-', ' ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
