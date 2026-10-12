export interface Opponent {
  id: number;
  name: string;
  gamertag?: string | null;
  overall?: number | null;
  build?: string | null;
  total_games: number;
  wins: number;
  losses: number;
  win_rate: number;
  last_played: string | null;
  created_at: string;
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
