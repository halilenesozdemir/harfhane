import type {
  ApiError,
  DailyWordResponse,
  PlayableLengthsResponse,
  RandomWordResponse,
  ValidateWordResponse,
} from '@harfhane/shared';

const DEFAULT_API_URL = 'https://api.harfhane.app/api';
const DEFAULT_WORD_LENGTH = 5;
const INVALID_RESPONSE_CODE = 'INVALID_RESPONSE';
const HTTP_ERROR_CODE = 'HTTP_ERROR';
const REQUEST_TIMEOUT_CODE = 'REQUEST_TIMEOUT';
// A half-open connection (no response, no error) otherwise leaves the caller's promise pending
// forever: in useGame.ts, that keeps isInFlight true and the keyboard locked past a submit.
export const REQUEST_TIMEOUT_MS = 10_000;

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export interface ApiClientOptions {
  readonly baseUrl?: string;
  readonly fetchImpl?: typeof fetch;
}

export interface ApiClient {
  fetchDailyWord(length: number): Promise<DailyWordResponse>;
  fetchRandomWord(length: number): Promise<RandomWordResponse>;
  validateWord(word: string): Promise<ValidateWordResponse>;
  fetchPlayableLengths(): Promise<PlayableLengthsResponse>;
}

function lengthQuery(length: number): string {
  return length === DEFAULT_WORD_LENGTH ? '' : `?length=${length}`;
}

async function readBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new ApiRequestError(`HTTP ${response.status}`, response.status, INVALID_RESPONSE_CODE);
  }
}

function toApiRequestError(body: unknown, status: number): ApiRequestError {
  const apiError = (body as Partial<ApiError>).error;
  return new ApiRequestError(apiError?.message ?? `HTTP ${status}`, status, apiError?.code ?? HTTP_ERROR_CODE);
}

export function createApiClient({ baseUrl = DEFAULT_API_URL, fetchImpl = fetch }: ApiClientOptions = {}): ApiClient {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetchImpl(`${baseUrl}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...init,
        signal: controller.signal,
      });
      const body = await readBody(response);
      if (!response.ok) throw toApiRequestError(body, response.status);
      return (body as { data: T }).data;
    } catch (error) {
      // Mapped onto the same ApiRequestError the caller already handles (useGame.ts's generic
      // .catch), so a timeout shows the same retry/error state as any other request failure.
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiRequestError('Request timed out', 0, REQUEST_TIMEOUT_CODE);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return {
    fetchDailyWord: (length) => request<DailyWordResponse>(`/words/daily${lengthQuery(length)}`),
    fetchRandomWord: (length) => request<RandomWordResponse>(`/words/random${lengthQuery(length)}`),
    validateWord: (word) => request<ValidateWordResponse>('/words/validate', { method: 'POST', body: JSON.stringify({ word }) }),
    fetchPlayableLengths: () => request<PlayableLengthsResponse>('/words/lengths'),
  };
}

export const api = createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL });
