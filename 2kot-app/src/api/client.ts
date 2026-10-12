// Client for the local 2KOT server (see ../../../2kot-server). In development
// Vite proxies /api to it, so no host is hard-coded here.

import type { Game, Opponent, Statistics } from '../types';
import type { LiveState } from '../types/dashboard';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      ...init,
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    });
  } catch {
    throw new ApiError('The tracker service is not reachable', 0);
  }

  if (!response.ok) {
    // The dev proxy answers 5xx when the server itself is down.
    if (response.status >= 500) {
      throw new ApiError('The tracker service is not reachable', 0);
    }
    const body = await response.json().catch(() => null);
    const detail = body?.detail;
    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail) && detail[0]?.msg
          ? String(detail[0].msg).replace(/^Value error, /, '')
          : `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

export interface NewOpponent {
  name: string;
  gamertag?: string;
  overall?: number;
  build?: string;
}

export interface NewGameResult {
  opponent_id?: number;
  opponent_name?: string;
  your_score: number;
  opponent_score: number;
  game_type: string;
}

export const api = {
  listOpponents: () => request<Opponent[]>('/opponents'),
  createOpponent: (body: NewOpponent) =>
    request<Opponent>('/opponents', { method: 'POST', body: JSON.stringify(body) }),
  deleteOpponent: (id: number) => request<void>(`/opponents/${id}`, { method: 'DELETE' }),
  listGames: () => request<Game[]>('/games'),
  logGame: (body: NewGameResult) =>
    request<Game>('/game_result', { method: 'POST', body: JSON.stringify(body) }),
  deleteGame: (id: number) => request<void>(`/games/${id}`, { method: 'DELETE' }),
  getStatistics: () => request<Statistics>('/stats'),
  getLive: () => request<LiveState>('/live'),
};
