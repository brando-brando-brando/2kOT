// Maps the app's existing data (opponents, games, statistics) to the
// dashboard view models. This is the single seam where real capture data
// will be connected later.

import type { Game, Opponent, Statistics } from '../types';
import type {
  DashboardData,
  GameHistoryRow,
  OpponentSummary,
  OverallStats,
} from '../types/dashboard';
import { sampleDashboardData } from './mockData';

function byNewest(a: Game, b: Game) {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

export function toOpponentSummary(opponent: Opponent, games: Game[]): OpponentSummary {
  const played = games.filter((g) => g.opponent_id === opponent.id).sort(byNewest);
  const lastResult = played[0]?.outcome;

  let streak = 0;
  for (const game of played) {
    if (game.outcome !== lastResult) break;
    streak += 1;
  }

  return {
    id: opponent.id,
    name: opponent.name,
    gamertag: opponent.gamertag,
    wins: opponent.wins,
    losses: opponent.losses,
    winRate: opponent.win_rate,
    lastPlayed: opponent.last_played,
    lastResult,
    streak: lastResult === 'loss' ? -streak : streak,
  };
}

export function toOverallStats(stats: Statistics): OverallStats {
  return {
    totalGames: stats.total_games,
    wins: stats.total_wins,
    losses: stats.total_losses,
    winRate: stats.overall_win_rate,
    streak: stats.current_streak,
  };
}

export function toHistoryRows(games: Game[], opponents: Opponent[]): GameHistoryRow[] {
  const byId = new Map(opponents.map((o) => [o.id, o]));

  return [...games].sort(byNewest).map((game) => {
    const opponent = byId.get(game.opponent_id);
    return {
      id: game.id,
      date: game.date,
      opponent: opponent?.name ?? 'Unknown',
      result: game.outcome,
      yourScore: game.your_score,
      opponentScore: game.opponent_score,
      mode: game.game_type,
      recordWins: opponent?.wins ?? 0,
      recordLosses: opponent?.losses ?? 0,
    };
  });
}

export function buildDashboardData(
  opponents: Opponent[],
  games: Game[],
  stats: Statistics,
): DashboardData {
  // Nothing tracked yet: show the labelled sample dashboard instead of a wall
  // of empty cards.
  if (opponents.length === 0 && games.length === 0) {
    return sampleDashboardData;
  }

  const sortedGames = [...games].sort(byNewest);
  const latestGame = sortedGames[0];
  const byId = new Map(opponents.map((o) => [o.id, o]));
  const latestOpponent = latestGame ? byId.get(latestGame.opponent_id) : undefined;
  const focus = latestOpponent ?? opponents[0];

  return {
    isSample: false,
    // No live game source exists yet; this is filled in once capture is wired up.
    currentGame: null,
    focusOpponent: focus ? toOpponentSummary(focus, games) : null,
    liveMatchup:
      latestGame && latestOpponent
        ? {
            opponent: { name: latestOpponent.name, gamertag: latestOpponent.gamertag },
            frame: { imageUrl: latestGame.start_frame_path, label: 'Matchup Screen' },
          }
        : null,
    endGame: latestGame
      ? {
          outcome: latestGame.outcome,
          yourScore: latestGame.your_score,
          opponentScore: latestGame.opponent_score,
          frame: { imageUrl: latestGame.end_frame_path, label: 'End Game Screen' },
        }
      : null,
    history: toHistoryRows(games, opponents),
    stats: toOverallStats(stats),
    recentOpponents: opponents.slice(0, 5).map((o) => toOpponentSummary(o, games)),
    nextMatchup: null,
  };
}
