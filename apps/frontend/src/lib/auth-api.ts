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

export function refreshToken(token: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/refresh', {
    method: 'POST',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
  });
}

export function getMe(token: string): Promise<AuthUser> {
  return request<AuthUser>('/auth/me', { headers: { ...authHeader(token), 'Content-Type': 'application/json' } });
}

import type { GameXPResult } from '@harfhane/shared';

export function saveResult(
  token: string,
  data: { date: string; word_length: number; guesses: number; won: boolean; mode?: 'daily' | 'unlimited'; word_id?: number }
): Promise<{ success: boolean; xp: GameXPResult | null }> {
  return request<{ success: boolean; xp: GameXPResult | null }>('/results', {
    method: 'POST',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function getXPProfile(token: string): Promise<import('@harfhane/shared').XPProfile> {
  return request<import('@harfhane/shared').XPProfile>('/xp/me', {
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
