export interface Opponent {
  id: number;
  name: string;
  gamertag?: string | null;
  overall?: number | null;
  level?: number | null;
  build?: string | null;
  total_games: number;
  wins: number;
  losses: number;
  win_rate: number;
  last_played: string | null;
  created_at: string;
}

export const STAT_COLUMNS = [
  'GRD',
  'MIN',
  'PTS',
  'REB',
  'AST',
  'STL',
  'BLK',
  'FOULS',
  'TO',
  'FGM/FGA',
  '3PM/3PA',
  'FTM/FTA',
] as const;

export type StatColumn = (typeof STAT_COLUMNS)[number];
export type StatRow = Partial<Record<StatColumn, number | string>>;

/** Box-score lines for a game, as read from the stats screen or a photo. */
export interface GameStats {
  you?: StatRow;
  opponent?: StatRow;
}

export interface Game {
  id: number;
  opponent_id: number;
  your_score: number;
  opponent_score: number;
  outcome: 'win' | 'loss';
  game_type: string;
  date: string;
  source?: 'manual' | 'capture';
  stats?: GameStats | null;
  /** URL of a stats photo or screenshot added after the game */
  stats_photo_path?: string | null;
  /** URL of the captured frame, when one exists */
  start_frame_path?: string | null;
  end_frame_path?: string | null;
}

export interface Statistics {
  total_games: number;
  total_wins: number;
  total_losses: number;
  overall_win_rate: number;
  current_streak: number;
  most_frequent_opponents: Opponent[];
}

export interface Settings {
  captureMode: 'auto' | 'manual';
  hotkeyEnabled: boolean;
  hotkey: string;
  importFolderPath: string;
  sampleRate: number;
  ocrConfidenceThreshold: number;
}
