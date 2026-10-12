import { cn } from '../utils/cn';
import type { OverallStats } from '../types/dashboard';
import { formatPercent } from '../utils/format';
import { StatMetricCard } from './StatMetricCard';
import { Card, SectionHeader } from './ui/Card';

interface QuickStatsCardProps {
  stats: OverallStats;
  className?: string;
}

export function QuickStatsCard({ stats, className }: QuickStatsCardProps) {
  return (
    <Card label="Quick stats" className={cn('@container', className)}>
      <SectionHeader title="Quick Stats" />
      <div className="grid grid-cols-2 gap-3 @md:grid-cols-4">
        <StatMetricCard label="Total Games" value={stats.totalGames} />
        <StatMetricCard label="Wins" value={stats.wins} accent="success" />
        <StatMetricCard label="Losses" value={stats.losses} accent="destructive" />
        <StatMetricCard label="Win Rate" value={formatPercent(stats.winRate)} accent="cyan" />
      </div>
    </Card>
  );
}
