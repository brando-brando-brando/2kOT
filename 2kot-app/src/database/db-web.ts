import type { Opponent, Game, Statistics } from '../types';

// In-memory database for web version (will be replaced with SQLite in Electron)
let opponents: Opponent[] = [];
let games: Game[] = [];
let nextOpponentId = 1;
let nextGameId = 1;

// Opponent operations
export function createOpponent(name: string, gamertag?: string): Opponent {
  const opponent: Opponent = {
    id: nextOpponentId++,
    name,
    gamertag,
    total_games: 0,
    wins: 0,
    losses: 0,
    win_rate: 0,
    last_played: null,
    created_at: new Date().toISOString(),
  };
  opponents.push(opponent);
  return opponent;
}

export function getOpponentById(id: number): Opponent | null {
  return opponents.find(o => o.id === id) || null;
}

export function getAllOpponents(): Opponent[] {
  return [...opponents].sort((a, b) => {
    if (!a.last_played) return 1;
    if (!b.last_played) return -1;
    return new Date(b.last_played).getTime() - new Date(a.last_played).getTime();
  });
}

export function updateOpponent(id: number, updates: Partial<Pick<Opponent, 'name' | 'gamertag'>>): Opponent | null {
  const index = opponents.findIndex(o => o.id === id);
  if (index === -1) return null;

  opponents[index] = { ...opponents[index], ...updates };
  return opponents[index];
}

export function deleteOpponent(id: number): void {
  opponents = opponents.filter(o => o.id !== id);
  games = games.filter(g => g.opponent_id !== id);
}

export function searchOpponents(query: string): Opponent[] {
  const pattern = query.toLowerCase();
  return opponents.filter(
    o => o.name.toLowerCase().includes(pattern) ||
    (o.gamertag && o.gamertag.toLowerCase().includes(pattern))
  );
}

// Game operations
export function createGame(
  opponentId: number,
  yourScore: number,
  opponentScore: number,
  gameType: string = 'Quick Match',
  startFramePath?: string,
  endFramePath?: string
): Game {
  const outcome = yourScore > opponentScore ? 'win' : 'loss';

  const game: Game = {
    id: nextGameId++,
    opponent_id: opponentId,
    your_score: yourScore,
    opponent_score: opponentScore,
    outcome,
    game_type: gameType,
    date: new Date().toISOString(),
    start_frame_path: startFramePath,
    end_frame_path: endFramePath,
  };
  games.push(game);

  // Update opponent stats
  updateOpponentStats(opponentId);

  return game;
}

export function getGameById(id: number): Game | null {
  return games.find(g => g.id === id) || null;
}

export function getGamesByOpponent(opponentId: number): Game[] {
  return games
    .filter(g => g.opponent_id === opponentId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAllGames(): Game[] {
  return [...games].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function deleteGame(id: number): void {
  const game = getGameById(id);
  if (game) {
    games = games.filter(g => g.id !== id);
    updateOpponentStats(game.opponent_id);
  }
}

// Statistics
export function getStatistics(): Statistics {
  const totalGames = games.length;
  const totalWins = games.filter(g => g.outcome === 'win').length;
  const totalLosses = totalGames - totalWins;
  const overallWinRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

  // Calculate current streak
  let currentStreak = 0;
  if (games.length > 0) {
    const sortedGames = [...games].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const startOutcome = sortedGames[0].outcome;

    for (const game of sortedGames) {
      if (game.outcome === startOutcome) {
        currentStreak++;
      } else {
        break;
      }
    }
    if (startOutcome === 'loss') {
      currentStreak = -currentStreak;
    }
  }

  // Most frequent opponents
  const opponentCounts = new Map<number, number>();
  games.forEach(g => {
    opponentCounts.set(g.opponent_id, (opponentCounts.get(g.opponent_id) || 0) + 1);
  });

  const mostFrequentOpponents = [...opponents]
    .sort((a, b) => (opponentCounts.get(b.id) || 0) - (opponentCounts.get(a.id) || 0))
    .slice(0, 5);

  return {
    total_games: totalGames,
    total_wins: totalWins,
    total_losses: totalLosses,
    overall_win_rate: overallWinRate,
    current_streak: currentStreak,
    most_frequent_opponents: mostFrequentOpponents,
  };
}

// Helper functions
function updateOpponentStats(opponentId: number): void {
  const opponentGames = games.filter(g => g.opponent_id === opponentId);
  const totalGames = opponentGames.length;
  const wins = opponentGames.filter(g => g.outcome === 'win').length;
  const losses = totalGames - wins;
  const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
  const lastPlayed = opponentGames.length > 0
    ? opponentGames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
    : null;

  const index = opponents.findIndex(o => o.id === opponentId);
  if (index !== -1) {
    opponents[index] = {
      ...opponents[index],
      total_games: totalGames,
      wins,
      losses,
      win_rate: winRate,
      last_played: lastPlayed,
    };
  }
}
