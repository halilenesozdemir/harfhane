import type {
  DailyWordResponse,
  PlayableLengthsResponse,
  RandomWordResponse,
  ValidateWordResponse,
  ApiError,
} from '@harfhane/shared';

const BASE_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api').trim();

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
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

export function fetchPlayableLengths(): Promise<PlayableLengthsResponse> {
  return request<PlayableLengthsResponse>('/words/lengths');
}

export function validateWord(word: string): Promise<ValidateWordResponse> {
  return request<ValidateWordResponse>('/words/validate', {
    method: 'POST',
    body: JSON.stringify({ word }),
  });
}
