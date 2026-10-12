import type { DashboardData } from '../types/dashboard';
import { CurrentGameCard } from './CurrentGameCard';
import { EndGameResultCard } from './EndGameResultCard';
import { FutureEnhancementsCard } from './FutureEnhancementsCard';
import { GameHistoryTable } from './GameHistoryTable';
import { MatchupCard } from './MatchupCard';
import { MatchupPreviewCard } from './MatchupPreviewCard';
import { OpponentQuickStats } from './OpponentQuickStats';
import { QuickStatsCard } from './QuickStatsCard';
import { RecentOpponentsList } from './RecentOpponentsList';

interface DashboardViewProps {
  data: DashboardData;
  enhancements: string[];
  onViewAllGames?: () => void;
  onViewAllOpponents?: () => void;
}

export function DashboardView({ data, enhancements, onViewAllGames, onViewAllOpponents }: DashboardViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 @4xl:grid-cols-12">
      <CurrentGameCard game={data.currentGame} className="@4xl:col-span-8" />
      <OpponentQuickStats opponent={data.focusOpponent} className="@4xl:col-span-4" />

      <MatchupCard matchup={data.liveMatchup} className="@4xl:col-span-6" />
      <EndGameResultCard result={data.endGame} className="@4xl:col-span-6" />

      <GameHistoryTable
        games={data.history}
        limit={5}
        onViewAll={onViewAllGames}
        className="@4xl:col-span-12"
      />

      <div className="flex min-w-0 flex-col gap-4 @4xl:col-span-6">
        <QuickStatsCard stats={data.stats} />
        <RecentOpponentsList
          opponents={data.recentOpponents}
          onViewAll={onViewAllOpponents}
          className="flex-1"
        />
      </div>
      <div className="flex min-w-0 flex-col gap-4 @4xl:col-span-6">
        <MatchupPreviewCard matchup={data.nextMatchup} />
        <FutureEnhancementsCard items={enhancements} className="flex-1" />
      </div>
    </div>
  );
}
