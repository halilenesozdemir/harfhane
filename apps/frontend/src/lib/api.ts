import type {
  DailyWordResponse,
  RandomWordResponse,
  ValidateWordResponse,
  ApiError,
  WordEntry,
  WordList,
  WordListResponse,
  WordListsResponse,
  CreateListInput,
  AddWordsInput,
  AddWordsResult,
  UpdateListInput,
  ListLikeResponse,
  ListCommentsResponse,
  AddCommentResponse,
} from '@nurdle/shared';

const BASE_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api').trim();

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
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

export function fetchWordById(wordId: number): Promise<{ word: WordEntry; wordId: number }> {
  return request<{ word: WordEntry; wordId: number }>(`/words/challenge/${wordId}`);
}

export function validateWord(word: string): Promise<ValidateWordResponse> {
  return request<ValidateWordResponse>('/words/validate', {
    method: 'POST',
    body: JSON.stringify({ word }),
  });
}

export type WordListInfo = WordList;

export function fetchPublicLists(): Promise<{ lists: WordListInfo[] }> {
  return request<{ lists: WordListInfo[] }>('/lists');
}

export function fetchListInfo(slug: string): Promise<{ list: WordListInfo }> {
  return request<{ list: WordListInfo }>(`/lists/${slug}`);
}

export function fetchRandomWordFromList(slug: string): Promise<RandomWordResponse> {
  return request<RandomWordResponse>(`/lists/${slug}/random`);
}

export function fetchDailyWordFromList(slug: string, date: string): Promise<DailyWordResponse> {
  return request<DailyWordResponse>(`/lists/${slug}/daily?date=${date}`);
}

export function validateWordInList(slug: string, word: string): Promise<ValidateWordResponse> {
  return request<ValidateWordResponse>(`/lists/${slug}/validate`, {
    method: 'POST',
    body: JSON.stringify({ word }),
  });
}

// --- User list management (auth required) ---

export function fetchMyLists(token: string): Promise<WordListsResponse> {
  return request<WordListsResponse>('/lists/mine', undefined, token);
}

export function createList(token: string, input: CreateListInput): Promise<WordListResponse> {
  return request<WordListResponse>('/lists', { method: 'POST', body: JSON.stringify(input) }, token);
}

export function updateList(token: string, slug: string, patch: UpdateListInput): Promise<WordListResponse> {
  return request<WordListResponse>(`/lists/${slug}`, { method: 'PATCH', body: JSON.stringify(patch) }, token);
}

export function deleteList(token: string, slug: string): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/lists/${slug}`, { method: 'DELETE' }, token);
}

export function addWordsToList(token: string, slug: string, input: AddWordsInput): Promise<AddWordsResult> {
  return request<AddWordsResult>(`/lists/${slug}/words`, { method: 'POST', body: JSON.stringify(input) }, token);
}

// --- Social (likes & comments) ---

export function fetchListLikes(slug: string, token?: string): Promise<{ count: number; liked: boolean }> {
  return request<{ count: number; liked: boolean }>(`/lists/${slug}/likes`, undefined, token);
}

export function toggleLike(token: string, slug: string): Promise<ListLikeResponse> {
  return request<ListLikeResponse>(`/lists/${slug}/like`, { method: 'POST' }, token);
}

export function fetchListComments(slug: string): Promise<ListCommentsResponse> {
  return request<ListCommentsResponse>(`/lists/${slug}/comments`);
}

export function addComment(token: string, slug: string, content: string): Promise<AddCommentResponse> {
  return request<AddCommentResponse>(`/lists/${slug}/comments`, { method: 'POST', body: JSON.stringify({ content }) }, token);
}

export function deleteComment(token: string, slug: string, commentId: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/lists/${slug}/comments/${commentId}`, { method: 'DELETE' }, token);
}
