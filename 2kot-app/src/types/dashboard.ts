// View-model types for the dashboard UI. Presentation components depend on
// these rather than on database rows, so real capture/OCR data can be mapped
// in later without touching the components.

export type GameResult = 'win' | 'loss';

export type GameStatus = 'live' | 'ended' | 'upcoming';

export type CaptureState = 'connected' | 'recording' | 'processing' | 'idle' | 'disconnected';

export type AppView = 'dashboard' | 'opponents' | 'stats' | 'settings';

export interface PlayerIdentity {
  name: string;
  gamertag?: string;
  /** Overall rating, e.g. 93 */
  overall?: number;
  /** Build / playstyle summary, e.g. "2-Way 3-Level Scorer" */
  build?: string;
  /** Position and measurements, e.g. "SF | 6'7\" | 215 lbs" */
  vitals?: string;
  avatarUrl?: string;
}

export interface CapturedFrame {
  /** URL or path of the captured frame; a placeholder is shown when absent */
  imageUrl?: string;
  /** Display timestamp of the capture, e.g. "00:00" */
  capturedAt?: string;
  /** What the frame shows, e.g. "Matchup Screen" */
  label: string;
}

export interface CurrentGame {
  status: GameStatus;
  opponent: PlayerIdentity;
  yourLabel?: string;
  quarter?: number;
  clock?: string;
  frame?: CapturedFrame;
}

export interface OpponentSummary extends PlayerIdentity {
  id: number;
  wins: number;
  losses: number;
  /** 0-100 */
  winRate: number;
  /** ISO date string */
  lastPlayed?: string | null;
  lastResult?: GameResult;
  /** Positive = consecutive wins vs this opponent, negative = losses */
  streak?: number;
}

export interface MatchupCapture {
  opponent: PlayerIdentity;
  frame: CapturedFrame;
}

export interface EndGameResult {
  outcome: GameResult;
  yourScore: number;
  opponentScore: number;
  frame: CapturedFrame;
}

export interface GameHistoryRow {
  id: number;
  /** ISO date string */
  date: string;
  opponent: string;
  result: GameResult;
  yourScore: number;
  opponentScore: number;
  mode: string;
  /** Head-to-head record against this opponent */
  recordWins: number;
  recordLosses: number;
}

export interface OverallStats {
  totalGames: number;
  wins: number;
  losses: number;
  /** 0-100 */
  winRate: number;
  /** Positive = win streak, negative = losing streak */
  streak: number;
}

export interface DashboardData {
  /** True when the values below are sample data rather than tracked games */
  isSample: boolean;
  currentGame: CurrentGame | null;
  focusOpponent: OpponentSummary | null;
  liveMatchup: MatchupCapture | null;
  endGame: EndGameResult | null;
  history: GameHistoryRow[];
  stats: OverallStats;
  recentOpponents: OpponentSummary[];
  nextMatchup: MatchupCapture | null;
}

/** Live state reported by the server's session tracker (GET /api/live). */
export interface LiveState {
  capture_state: CaptureState;
  last_frame_at: string | null;
  session: {
    phase: 'idle' | 'matchup' | 'in_progress' | 'ended';
    opponent_name: string | null;
    opponent_overall: number | null;
    opponent_build: string | null;
    quarter: number | null;
    clock: string | null;
    start_frame_url: string | null;
  };
}
