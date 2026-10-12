import { cn } from '../utils/cn';
import type { Opponent } from '../types';

interface RecentOpponentsListProps {
  opponents?: Opponent[];
}

export function RecentOpponentsList({ opponents }: RecentOpponentsListProps) {
  const displayOpponents = opponents?.slice(0, 5) || [];

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Recent Opponents</h2>
        <button className="text-sm text-primary hover:text-primary-hover font-medium transition-colors">
          View All
        </button>
      </div>

      <div className="space-y-3">
        {displayOpponents.length === 0 ? (
          <div className="text-center py-8 text-foreground-secondary opacity-50">
            No recent opponents
          </div>
        ) : (
          displayOpponents.map((opponent) => {
            const winRate = opponent.win_rate.toFixed(0);
            const isWinning = opponent.win_rate >= 50;

            return (
              <div
                key={opponent.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-background-secondary/50 hover:bg-background-secondary transition-colors cursor-pointer group"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-background-secondary border-2 border-border group-hover:border-primary/50 transition-colors flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-foreground-secondary group-hover:text-primary transition-colors">
                    {opponent.name.charAt(0)}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground truncate">{opponent.name}</div>
                  <div className="text-sm text-foreground-secondary">
                    {opponent.wins}-{opponent.losses} ({winRate}%)
                  </div>
                </div>

                {/* Win Rate Badge */}
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold",
                  isWinning
                    ? "bg-success/20 text-success"
                    : "bg-destructive/20 text-destructive"
                )}>
                  {winRate}%
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
