import { X, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../utils/cn';
import type { Opponent } from '../types';

interface OpponentCardProps {
  opponent: Opponent;
  onClick?: () => void;
  onDelete?: () => void;
}

export function OpponentCard({ opponent, onClick, onDelete }: OpponentCardProps) {
  const winRate = opponent.win_rate.toFixed(0);
  const lastPlayed = opponent.last_played
    ? format(new Date(opponent.last_played), 'MMM d')
    : 'Never';

  const isWinning = opponent.win_rate >= 50;

  return (
    <div
      className={cn(
        "relative bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-2xl p-5 hover:border-primary/50 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:shadow-primary/10",
        onClick && "hover:-translate-y-1"
      )}
      onClick={onClick}
    >
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-destructive/20 rounded-lg"
        >
          <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
        </button>
      )}

      {/* Opponent Name */}
      <div className="mb-4">
        <h3 className="text-xl font-bold text-foreground mb-1">{opponent.name}</h3>
        {opponent.gamertag && (
          <p className="text-sm text-muted-foreground font-medium">{opponent.gamertag}</p>
        )}
      </div>

      {/* Win/Loss Record */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-foreground">{opponent.wins}</span>
          <span className="text-xl text-muted-foreground">-</span>
          <span className="text-3xl font-bold text-foreground">{opponent.losses}</span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">{winRate}%</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Win Rate</div>
        </div>
      </div>

      {/* Win Rate Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isWinning ? "bg-success" : "bg-destructive"
            )}
            style={{ width: `${opponent.win_rate}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>{lastPlayed}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isWinning ? (
            <TrendingUp className="w-3.5 h-3.5 text-success" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-destructive" />
          )}
          <span>{opponent.total_games} games</span>
        </div>
      </div>
    </div>
  );
}
