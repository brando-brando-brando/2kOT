import { cn } from '../utils/cn';

interface MatchupPreviewCardProps {
  opponentName?: string;
  opponentRating?: number;
  playstyle?: string;
}

export function MatchupPreviewCard({
  opponentName = 'Upcoming Opponent',
  opponentRating = 0,
  playstyle = 'Unknown',
}: MatchupPreviewCardProps) {
  return (
    <div className="glass rounded-2xl p-6 glow-cyan">
      <h2 className="text-lg font-semibold text-foreground mb-4">Matchup Preview</h2>

      {/* Opponent */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-background-secondary border-2 border-primary/50 flex items-center justify-center">
          <span className="text-2xl font-bold text-primary">?</span>
        </div>
        <div>
          <div className="text-xl font-bold text-foreground">{opponentName}</div>
          {opponentRating > 0 && (
            <div className="text-sm text-foreground-secondary">OVR {opponentRating}</div>
          )}
        </div>
      </div>

      {/* Playstyle */}
      <div className="mb-4">
        <div className="text-sm text-foreground-secondary mb-1">Playstyle</div>
        <div className="text-foreground font-medium">{playstyle}</div>
      </div>

      {/* VS Visual */}
      <div className="flex items-center justify-center gap-4 py-4 bg-background-secondary/50 rounded-xl">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-background-secondary border-2 border-border flex items-center justify-center mb-1">
            <span className="text-lg font-bold text-primary">YOU</span>
          </div>
          <div className="text-xs text-foreground-secondary">Your Build</div>
        </div>
        <div className="text-2xl font-bold text-magenta text-glow-magenta">VS</div>
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-background-secondary border-2 border-border flex items-center justify-center mb-1">
            <span className="text-lg font-bold text-foreground-secondary">?</span>
          </div>
          <div className="text-xs text-foreground-secondary">Opponent</div>
        </div>
      </div>
    </div>
  );
}
