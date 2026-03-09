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

export function getMe(token: string): Promise<AuthUser> {
  return request<AuthUser>('/auth/me', { headers: { ...authHeader(token), 'Content-Type': 'application/json' } });
}

export function saveResult(
  token: string,
  data: { date: string; word_length: number; guesses: number; won: boolean }
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/results', {
    method: 'POST',
    headers: { ...authHeader(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
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
}

export function getLeaderboard(): Promise<{ leaderboard: LeaderboardRow[] }> {
  return request<{ leaderboard: LeaderboardRow[] }>('/results/leaderboard');
}
