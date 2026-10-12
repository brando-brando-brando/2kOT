import { cn } from '../utils/cn';

interface MatchupCardProps {
  opponentName?: string;
  opponentRating?: number;
  timestamp?: string;
  screenshotUrl?: string;
}

export function MatchupCard({
  opponentName = 'No Matchup',
  opponentRating = 0,
  timestamp = new Date().toLocaleTimeString(),
  screenshotUrl,
}: MatchupCardProps) {
  return (
    <div className="glass rounded-2xl overflow-hidden glow-cyan">
      {/* Screenshot Area */}
      <div className="relative aspect-video bg-background-secondary flex items-center justify-center">
        {screenshotUrl ? (
          <img
            src={screenshotUrl}
            alt="Matchup screenshot"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center">
            <div className="text-6xl mb-2 opacity-30">🎮</div>
            <div className="text-foreground-secondary opacity-50">Matchup Preview</div>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />

        {/* Opponent Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold text-foreground">{opponentName}</div>
              {opponentRating > 0 && (
                <div className="text-sm text-foreground-secondary">OVR {opponentRating}</div>
              )}
            </div>
            <div className="text-xs text-foreground-secondary opacity-70">
              {timestamp}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
