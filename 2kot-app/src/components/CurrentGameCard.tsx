import { cn } from '../utils/cn';

interface CurrentGameCardProps {
  opponentName?: string;
  opponentRating?: number;
  yourScore?: number;
  opponentScore?: number;
  quarter?: number;
  timeRemaining?: string;
  gameStatus?: 'live' | 'ended' | 'upcoming';
}

export function CurrentGameCard({
  opponentName = 'Awaiting Matchup',
  opponentRating = 0,
  yourScore = 0,
  opponentScore = 0,
  quarter = 1,
  timeRemaining = '12:00',
  gameStatus = 'upcoming',
}: CurrentGameCardProps) {
  const isLive = gameStatus === 'live';
  const isEnded = gameStatus === 'ended';

  return (
    <div className="glass rounded-2xl p-6 glow-cyan">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Current Game</h2>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider",
          isLive ? "bg-success/20 text-success" : isEnded ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
        )}>
          {gameStatus}
        </div>
      </div>

      {/* Matchup */}
      <div className="flex items-center justify-between mb-6">
        {/* Your Team */}
        <div className="flex-1 text-center">
          <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-background-secondary border-2 border-border flex items-center justify-center">
            <span className="text-3xl font-bold text-primary">YOU</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{yourScore}</div>
        </div>

        {/* VS */}
        <div className="px-6">
          <div className="text-2xl font-bold text-magenta text-glow-magenta">VS</div>
        </div>

        {/* Opponent */}
        <div className="flex-1 text-center">
          <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-background-secondary border-2 border-border flex items-center justify-center">
            <span className="text-3xl font-bold text-foreground-secondary">?</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{opponentScore}</div>
        </div>
      </div>

      {/* Opponent Info */}
      <div className="text-center mb-4">
        <div className="text-xl font-bold text-foreground mb-1">{opponentName}</div>
        {opponentRating > 0 && (
          <div className="text-sm text-foreground-secondary">OVR {opponentRating}</div>
        )}
      </div>

      {/* Game Info */}
      <div className="flex items-center justify-center gap-6 text-sm text-foreground-secondary">
        <div className="flex items-center gap-2">
          <span className="text-primary font-semibold">Q{quarter}</span>
          <span>{timeRemaining}</span>
        </div>
      </div>
    </div>
  );
}
