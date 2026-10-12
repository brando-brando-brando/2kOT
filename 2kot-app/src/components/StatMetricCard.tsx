import { cn } from '../utils/cn';

interface StatMetricCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  accent?: 'cyan' | 'magenta' | 'success' | 'destructive';
}

export function StatMetricCard({ label, value, trend, accent = 'cyan' }: StatMetricCardProps) {
  const accentColors = {
    cyan: 'text-primary border-primary/30',
    magenta: 'text-magenta border-magenta/30',
    success: 'text-success border-success/30',
    destructive: 'text-destructive border-destructive/30',
  };

  const glowColors = {
    cyan: 'glow-cyan',
    magenta: 'glow-magenta',
    success: 'glow-success',
    destructive: 'glow-destructive',
  };

  return (
    <div className={cn(
      "glass rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1",
      glowColors[accent]
    )}>
      <div className={cn(
        "text-4xl font-bold mb-2",
        accentColors[accent]
      )}>
        {value}
      </div>
      <div className="text-sm text-foreground-secondary uppercase tracking-wider font-medium">
        {label}
      </div>
      {trend && (
        <div className="mt-2 text-xs text-foreground-secondary opacity-60">
          {trend === 'up' && '↑ Increasing'}
          {trend === 'down' && '↓ Decreasing'}
          {trend === 'neutral' && '→ Stable'}
        </div>
      )}
    </div>
  );
}
