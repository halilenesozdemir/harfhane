import type {
  DailyWordResponse,
  RandomWordResponse,
  ValidateWordResponse,
  ApiError,
} from '@nurdle/shared';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  const json = (await res.json()) as { data: T } | ApiError;

  if (!res.ok) {
    const err = json as ApiError;
    throw new Error(err.error?.message ?? 'API error');
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

export async function validateWord(word: string): Promise<ValidateWordResponse> {
  return request<ValidateWordResponse>('/words/validate', {
    method: 'POST',
    body: JSON.stringify({ word }),
  });
}
