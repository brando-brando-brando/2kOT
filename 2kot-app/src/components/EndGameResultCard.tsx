import { cn } from '../utils/cn';

interface EndGameResultCardProps {
  yourScore?: number;
  opponentScore?: number;
  outcome?: 'win' | 'loss';
  screenshotUrl?: string;
  timestamp?: string;
}

export function EndGameResultCard({
  yourScore = 0,
  opponentScore = 0,
  outcome = 'win',
  screenshotUrl,
  timestamp = new Date().toLocaleTimeString(),
}: EndGameResultCardProps) {
  const isWin = outcome === 'win';

  return (
    <div className={cn(
      "glass rounded-2xl overflow-hidden",
      isWin ? "glow-success" : "glow-destructive"
    )}>
      {/* Screenshot Area */}
      <div className="relative aspect-video bg-background-secondary flex items-center justify-center">
        {screenshotUrl ? (
          <img
            src={screenshotUrl}
            alt="End game screenshot"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-2 opacity-30">🏆</div>
            <div className="text-foreground-secondary opacity-50">End Game Result</div>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />

        {/* Result Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className={cn(
              "px-4 py-2 rounded-full text-lg font-bold uppercase tracking-wider",
              isWin ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
            )}>
              {isWin ? 'VICTORY' : 'DEFEAT'}
            </div>
            <div className="text-xs text-foreground-secondary opacity-70">
              {timestamp}
            </div>
          </div>

          {/* Score */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{yourScore}</div>
              <div className="text-xs text-foreground-secondary">YOU</div>
            </div>
            <div className="text-2xl font-bold text-foreground-secondary">-</div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{opponentScore}</div>
              <div className="text-xs text-foreground-secondary">OPPONENT</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
