const BASE_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api').trim();

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const json = await res.json() as { data: T } | { error: { code: string; message: string } };
  if (!res.ok) {
    const err = json as { error: { code: string; message: string } };
    throw new Error(err.error?.message ?? 'API error');
  }
  return (json as { data: T }).data;
}

function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export interface AuthUser {
  id: number;
  email: string;
  username: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export function register(email: string, username: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, username, password }),
  });
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function refreshToken(token: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/refresh', {
    method: 'POST',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
  });
}

export function getMe(token: string): Promise<AuthUser> {
  return request<AuthUser>('/auth/me', { headers: { ...authHeader(token), 'Content-Type': 'application/json' } });
}

import type { GameXPResult } from '@nurdle/shared';

export function saveResult(
  token: string,
  data: { date: string; word_length: number; guesses: number; won: boolean }
): Promise<{ success: boolean; xp: GameXPResult | null }> {
  return request<{ success: boolean; xp: GameXPResult | null }>('/results', {
    method: 'POST',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function getXPProfile(token: string): Promise<import('@nurdle/shared').XPProfile> {
  return request<import('@nurdle/shared').XPProfile>('/xp/me', {
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
  });
}

export interface LeaderboardRow {
  user_id: number;
  username: string;
  total_won: number;
  total_played: number;
  win_rate: number;
  current_streak: number;
  max_streak: number;
  total_xp: number;
  level: number;
}

export type LeaderboardPeriod = 'all' | 'week' | 'month';

export function getLeaderboard(period: LeaderboardPeriod = 'all'): Promise<{ leaderboard: LeaderboardRow[] }> {
  return request<{ leaderboard: LeaderboardRow[] }>(`/results/leaderboard?period=${period}`);
}

export function deleteAccount(token: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/auth/account', {
    method: 'DELETE',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
  });
}

export function forgotPassword(email: string): Promise<{ sent: boolean }> {
  return request<{ sent: boolean }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, password: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export function initiateGoogleLogin(): void {
  const base = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api').trim();
  window.location.href = `${base}/auth/google`;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export function getVapidPublicKey(): Promise<{ key: string }> {
  return request<{ key: string }>('/push/vapid-public-key');
}

export function subscribePush(token: string, payload: PushSubscriptionPayload): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify(payload),
  });
}

export function unsubscribePush(token: string, endpoint: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/push/unsubscribe', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeader(token) },
    body: JSON.stringify({ endpoint }),
  });
}

export function getEmailNotifications(token: string): Promise<{ enabled: boolean }> {
  return request<{ enabled: boolean }>('/notifications/email', {
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
  });
}

export function patchEmailNotifications(token: string, enabled: boolean): Promise<{ enabled: boolean }> {
  return request<{ enabled: boolean }>('/notifications/email', {
    method: 'PATCH',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
}

export interface ProfileStats {
  totalPlayed: number;
  totalWon: number;
  winRate: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: number[];
}

export interface ProfileData {
  stats: ProfileStats;
  freezeTokens: number;
  playedToday: boolean;
}

export function getProfileData(token: string): Promise<ProfileData> {
  return request<ProfileData>('/profile/me', {
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
  });
}

export function applyStreakFreeze(token: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/profile/freeze', {
    method: 'POST',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
  });
}

export interface TournamentWord {
  id: number;
  word: string;
  length: number;
  meaning?: string;
}

export interface TournamentStats {
  total_score: number;
  games_played: number;
  games_won: number;
  best_score: number;
}

export interface TournamentResult {
  score: number;
  total_score: number;
}

export interface TournamentLeaderboardRow {
  user_id: number;
  username: string;
  total_score: number;
  games_played: number;
  games_won: number;
  avg_guesses: number;
}

export function getTournamentWord(
  token: string
): Promise<{ word: TournamentWord; stats: TournamentStats }> {
  return request<{ word: TournamentWord; stats: TournamentStats }>('/tournament/word', {
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
  });
}

export function saveTournamentResult(
  token: string,
  data: { word_id: number; word_length: number; guesses: number; won: boolean }
): Promise<TournamentResult> {
  return request<TournamentResult>('/tournament/result', {
    method: 'POST',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export type TournamentLeaderboardPeriod = 'all' | 'week' | 'month';

export function getTournamentLeaderboard(
  period: TournamentLeaderboardPeriod = 'all'
): Promise<{ leaderboard: TournamentLeaderboardRow[] }> {
  return request<{ leaderboard: TournamentLeaderboardRow[] }>(
    `/tournament/leaderboard?period=${period}`
  );
}
