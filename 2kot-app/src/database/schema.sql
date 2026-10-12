-- Opponents table
CREATE TABLE IF NOT EXISTS opponents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  gamertag TEXT,
  total_games INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_rate REAL DEFAULT 0,
  last_played TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  opponent_id INTEGER NOT NULL,
  your_score INTEGER NOT NULL,
  opponent_score INTEGER NOT NULL,
  outcome TEXT NOT NULL CHECK(outcome IN ('win', 'loss')),
  game_type TEXT DEFAULT 'Quick Match',
  date TEXT DEFAULT CURRENT_TIMESTAMP,
  start_frame_path TEXT,
  end_frame_path TEXT,
  FOREIGN KEY (opponent_id) REFERENCES opponents(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_games_opponent_id ON games(opponent_id);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(date);
CREATE INDEX IF NOT EXISTS idx_opponents_last_played ON opponents(last_played);
