import type { MatchupCapture } from '../types/dashboard';
import { Card, SectionHeader } from './ui/Card';
import { MatchupPlate, PlayerSilhouette, VsMark } from './ui/Matchup';
import { FrameCaption, ScreenshotFrame } from './ui/ScreenshotFrame';

interface MatchupCardProps {
  /** Matchup screen captured at the start of the game */
  matchup: MatchupCapture | null;
  className?: string;
}

export function MatchupCard({ matchup, className }: MatchupCardProps) {
  const hasImage = Boolean(matchup?.frame.imageUrl);

  return (
    <Card label="Live matchup" className={className}>
      <SectionHeader title="Live Matchup" note="(captured at start)" />

      <ScreenshotFrame src={matchup?.frame.imageUrl} alt="Matchup screen capture">
        {!matchup ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-xs text-foreground-secondary">
            No matchup screen captured yet
          </div>
        ) : hasImage ? (
          // Real frame: keep it visible and only overlay the opponent's name.
          <div className="absolute inset-x-0 bottom-0 p-3">
            <div className="truncate text-base font-bold text-foreground">{matchup.opponent.name}</div>
            {matchup.opponent.overall !== undefined && (
              <div className="text-xs text-foreground-secondary">OVR {matchup.opponent.overall}</div>
            )}
          </div>
        ) : (
          <div className="grid h-full grid-cols-[3fr_auto_2fr] grid-rows-[minmax(0,1fr)] items-center gap-3 p-3">
            <div className="flex h-full min-w-0 items-end gap-2">
              <PlayerSilhouette className="hidden w-[17cqw] text-secondary/55 @md:block" />
              <MatchupPlate
                player={matchup.opponent}
                tag="The Matchup"
                size="sm"
                className="max-w-44 flex-1 self-center"
              />
            </div>
            <VsMark className="text-3xl @md:text-4xl" />
            <div className="flex h-full min-w-0 items-end justify-end">
              <PlayerSilhouette className="hidden w-[19cqw] text-primary/40 @xs:block" />
            </div>
          </div>
        )}
      </ScreenshotFrame>

      <FrameCaption capturedAt={matchup?.frame.capturedAt} label={matchup?.frame.label ?? 'Matchup Screen'} />
    </Card>
  );
}
