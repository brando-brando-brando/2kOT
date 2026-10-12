import { TrendingUp, TrendingDown, Calendar, Gamepad2 } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Opponent } from '../types';

interface OpponentQuickStatsProps {
  opponent: Opponent;
}

export function OpponentQuickStats({ opponent }: OpponentQuickStatsProps) {
  const winRate = opponent.win_rate.toFixed(0);
  const isWinning = opponent.win_rate >= 50;
  const lastPlayed = opponent.last_played
    ? new Date(opponent.last_played).toLocaleDateString()
    : 'Never';

  return (
    <div className="glass rounded-2xl p-6 glow-magenta">
      <h2 className="text-lg font-semibold text-foreground mb-4">Opponent Quick Stats</h2>

      {/* Opponent Identity */}
      <div className="mb-6 pb-4 border-b border-border-muted">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-background-secondary border-2 border-magenta/50 flex items-center justify-center">
            <span className="text-2xl font-bold text-magenta">{opponent.name.charAt(0)}</span>
          </div>
          <div>
            <div className="text-xl font-bold text-foreground">{opponent.name}</div>
            {opponent.gamertag && (
              <div className="text-sm text-foreground-secondary">{opponent.gamertag}</div>
            )}
          </div>
        </div>
      </div>

      {/* Record */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-3xl font-bold text-success">{opponent.wins}</div>
          <div className="text-xs text-foreground-secondary uppercase tracking-wider mt-1">Wins</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-destructive">{opponent.losses}</div>
          <div className="text-xs text-foreground-secondary uppercase tracking-wider mt-1">Losses</div>
        </div>
        <div className="text-center">
          <div className={cn(
            "text-3xl font-bold",
            isWinning ? "text-success" : "text-destructive"
          )}>
            {winRate}%
          </div>
          <div className="text-xs text-foreground-secondary uppercase tracking-wider mt-1">Win Rate</div>
        </div>
      </div>

      {/* Win Rate Progress */}
      <div className="mb-6">
        <div className="h-2 bg-background-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isWinning ? "bg-success" : "bg-destructive"
            )}
            style={{ width: `${opponent.win_rate}%` }}
          />
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-foreground-secondary">
            <Calendar className="w-4 h-4" />
            <span>Last Played</span>
          </div>
          <span className="text-foreground font-medium">{lastPlayed}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-foreground-secondary">
            <Gamepad2 className="w-4 h-4" />
            <span>Total Games</span>
          </div>
          <span className="text-foreground font-medium">{opponent.total_games}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-foreground-secondary">
            {isWinning ? (
              <TrendingUp className="w-4 h-4 text-success" />
            ) : (
              <TrendingDown className="w-4 h-4 text-destructive" />
            )}
            <span>Current Trend</span>
          </div>
          <span className={cn(
            "font-medium",
            isWinning ? "text-success" : "text-destructive"
          )}>
            {isWinning ? 'Winning' : 'Losing'}
          </span>
        </div>
      </div>
    </div>
  );
}
