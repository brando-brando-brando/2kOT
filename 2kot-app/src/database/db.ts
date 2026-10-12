import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { Opponent, Game, Statistics } from '../types';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = process.env.NODE_ENV === 'test'
      ? ':memory:'
      : join(homedir(), '.2kot', '2kot.db');

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    // Initialize schema
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    db.exec(schema);
  }

  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// Opponent operations
export function createOpponent(name: string, gamertag?: string): Opponent {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO opponents (name, gamertag, total_games, wins, losses, win_rate, last_played)
    VALUES (?, ?, 0, 0, 0, 0, NULL)
  `);
  const result = stmt.run(name, gamertag);
  return getOpponentById(result.lastInsertRowid as number)!;
}

export function getOpponentById(id: number): Opponent | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM opponents WHERE id = ?');
  const row = stmt.get(id) as any;
  return row ? mapOpponentFromDb(row) : null;
}

export function getAllOpponents(): Opponent[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM opponents ORDER BY last_played DESC NULLS LAST');
  const rows = stmt.all() as any[];
  return rows.map(mapOpponentFromDb);
}

export function updateOpponent(id: number, updates: Partial<Pick<Opponent, 'name' | 'gamertag'>>): Opponent | null {
  const db = getDatabase();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.gamertag !== undefined) {
    fields.push('gamertag = ?');
    values.push(updates.gamertag);
  }

  if (fields.length === 0) return getOpponentById(id);

  values.push(id);
  const stmt = db.prepare(`UPDATE opponents SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  return getOpponentById(id);
}

export function deleteOpponent(id: number): void {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM opponents WHERE id = ?');
  stmt.run(id);
}

export function searchOpponents(query: string): Opponent[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM opponents
    WHERE name LIKE ? OR gamertag LIKE ?
    ORDER BY last_played DESC NULLS LAST
  `);
  const pattern = `%${query}%`;
  const rows = stmt.all(pattern, pattern) as any[];
  return rows.map(mapOpponentFromDb);
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
  const db = getDatabase();
  const outcome = yourScore > opponentScore ? 'win' : 'loss';

  const stmt = db.prepare(`
    INSERT INTO games (opponent_id, your_score, opponent_score, outcome, game_type, start_frame_path, end_frame_path)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(opponentId, yourScore, opponentScore, outcome, gameType, startFramePath, endFramePath);

  // Update opponent stats
  updateOpponentStats(opponentId);

  return getGameById(result.lastInsertRowid as number)!;
}

export function getGameById(id: number): Game | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM games WHERE id = ?');
  const row = stmt.get(id) as any;
  return row ? mapGameFromDb(row) : null;
}

export function getGamesByOpponent(opponentId: number): Game[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM games WHERE opponent_id = ? ORDER BY date DESC');
  const rows = stmt.all(opponentId) as any[];
  return rows.map(mapGameFromDb);
}

export function getAllGames(): Game[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM games ORDER BY date DESC');
  const rows = stmt.all() as any[];
  return rows.map(mapGameFromDb);
}

export function deleteGame(id: number): void {
  const db = getDatabase();
  const game = getGameById(id);
  if (game) {
    const stmt = db.prepare('DELETE FROM games WHERE id = ?');
    stmt.run(id);
    updateOpponentStats(game.opponent_id);
  }
}

// Statistics
export function getStatistics(): Statistics {
  const db = getDatabase();

  const totalGamesStmt = db.prepare('SELECT COUNT(*) as count FROM games');
  const totalGames = (totalGamesStmt.get() as any).count;

  const totalWinsStmt = db.prepare("SELECT COUNT(*) as count FROM games WHERE outcome = 'win'");
  const totalWins = (totalWinsStmt.get() as any).count;

  const totalLosses = totalGames - totalWins;
  const overallWinRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

  // Calculate current streak
  const recentGamesStmt = db.prepare(`
    SELECT outcome FROM games ORDER BY date DESC LIMIT 1
  `);
  const recentGame = recentGamesStmt.get() as any;

  let currentStreak = 0;
  if (recentGame) {
    const streakStmt = db.prepare(`
      SELECT outcome FROM games ORDER BY date DESC
    `);
    const games = streakStmt.all() as any[];
    const startOutcome = games[0].outcome;

    for (const game of games) {
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
  const frequentStmt = db.prepare(`
    SELECT o.*, COUNT(g.id) as game_count
    FROM opponents o
    JOIN games g ON o.id = g.opponent_id
    GROUP BY o.id
    ORDER BY game_count DESC
    LIMIT 5
  `);
  const mostFrequentOpponents = (frequentStmt.all() as any[]).map(mapOpponentFromDb);

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
  const db = getDatabase();

  const statsStmt = db.prepare(`
    SELECT
      COUNT(*) as total_games,
      SUM(CASE WHEN outcome = 'win' THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN outcome = 'loss' THEN 1 ELSE 0 END) as losses,
      MAX(date) as last_played
    FROM games
    WHERE opponent_id = ?
  `);
  const stats = statsStmt.get(opponentId) as any;

  const winRate = stats.total_games > 0 ? (stats.wins / stats.total_games) * 100 : 0;

  const updateStmt = db.prepare(`
    UPDATE opponents
    SET total_games = ?, wins = ?, losses = ?, win_rate = ?, last_played = ?
    WHERE id = ?
  `);
  updateStmt.run(stats.total_games, stats.wins, stats.losses, winRate, stats.last_played, opponentId);
}

function mapOpponentFromDb(row: any): Opponent {
  return {
    id: row.id,
    name: row.name,
    gamertag: row.gamertag,
    total_games: row.total_games,
    wins: row.wins,
    losses: row.losses,
    win_rate: row.win_rate,
    last_played: row.last_played,
    created_at: row.created_at,
  };
}

function mapGameFromDb(row: any): Game {
  return {
    id: row.id,
    opponent_id: row.opponent_id,
    your_score: row.your_score,
    opponent_score: row.opponent_score,
    outcome: row.outcome,
    game_type: row.game_type,
    date: row.date,
    start_frame_path: row.start_frame_path,
    end_frame_path: row.end_frame_path,
  };
}
