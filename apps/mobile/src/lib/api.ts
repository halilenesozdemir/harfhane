import type {
  ApiError,
  DailyWordResponse,
  PlayableLengthsResponse,
  RandomWordResponse,
  ValidateWordResponse,
} from '@harfhane/shared';
import type { FeedbackInput, FeedbackResponse } from './feedback-types';

const DEFAULT_API_URL = 'https://api.harfhane.app/api';
const DEFAULT_WORD_LENGTH = 5;
const INVALID_RESPONSE_CODE = 'INVALID_RESPONSE';
const HTTP_ERROR_CODE = 'HTTP_ERROR';

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
  submitFeedback(input: FeedbackInput): Promise<FeedbackResponse>;
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
    const response = await fetchImpl(`${baseUrl}${path}`, { headers: { 'Content-Type': 'application/json' }, ...init });
    const body = await readBody(response);
    if (!response.ok) throw toApiRequestError(body, response.status);
    return (body as { data: T }).data;
  }

  return {
    fetchDailyWord: (length) => request<DailyWordResponse>(`/words/daily${lengthQuery(length)}`),
    fetchRandomWord: (length) => request<RandomWordResponse>(`/words/random${lengthQuery(length)}`),
    validateWord: (word) => request<ValidateWordResponse>('/words/validate', { method: 'POST', body: JSON.stringify({ word }) }),
    fetchPlayableLengths: () => request<PlayableLengthsResponse>('/words/lengths'),
    submitFeedback: (input) => request<FeedbackResponse>('/feedback', { method: 'POST', body: JSON.stringify(input) }),
  };
}

export const api = createApiClient({ baseUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL });
