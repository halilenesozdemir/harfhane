import type {
  DailyWordResponse,
  RandomWordResponse,
  ValidateWordResponse,
  ApiError,
  WordEntry,
  UnlimitedPersonalStats,
  DuelPublic,
} from '@harfhane/shared';

const BASE_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api').trim();

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    ...init,
  });

  let json: { data: T } | ApiError;
  try {
    json = (await res.json()) as { data: T } | ApiError;
  } catch {
    throw new Error(res.ok ? 'Geçersiz sunucu yanıtı' : `HTTP ${res.status}`);
  }

  if (!res.ok) {
    const err = json as ApiError;
    throw new Error(err.error?.message ?? `HTTP ${res.status}`);
  }

  return (json as { data: T }).data;
}

export function fetchDailyWord(length?: number): Promise<DailyWordResponse> {
  const params = length && length !== 5 ? `?length=${length}` : '';
  return request<DailyWordResponse>(`/words/daily${params}`);
}

export function fetchRandomWord(length?: number): Promise<RandomWordResponse> {
  const params = length && length !== 5 ? `?length=${length}` : '';
  return request<RandomWordResponse>(`/words/random${params}`);
}

export function fetchWordById(wordId: number): Promise<{ word: WordEntry; wordId: number }> {
  return request<{ word: WordEntry; wordId: number }>(`/words/challenge/${wordId}`);
}

export function validateWord(word: string): Promise<ValidateWordResponse> {
  return request<ValidateWordResponse>('/words/validate', {
    method: 'POST',
    body: JSON.stringify({ word }),
  });
}

export function fetchUnlimitedStats(token: string): Promise<{ stats: UnlimitedPersonalStats }> {
  return request<{ stats: UnlimitedPersonalStats }>('/results/me/unlimited', undefined, token);
}

export function registerDuelResult(
  token: string,
  wordId: number,
  guesses: number,
  won: boolean
): Promise<{ duel: DuelPublic }> {
  return request<{ duel: DuelPublic }>(
    '/duels',
    { method: 'POST', body: JSON.stringify({ word_id: wordId, guesses, won }) },
    token
  );
}

export function fetchDuel(token: string, wordId: number): Promise<{ duel: DuelPublic }> {
  return request<{ duel: DuelPublic }>(`/duels/${wordId}`, undefined, token);
}
