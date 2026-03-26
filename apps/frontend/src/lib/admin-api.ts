const BASE_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api').trim();

async function adminRequest<T>(
  path: string,
  secret: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}/admin${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Secret': secret,
    },
    ...init,
  });

  const json = await res.json() as { data: T } | { error: { code: string; message: string } };

  if (!res.ok) {
    const err = json as { error: { code: string; message: string } };
    throw new Error(err.error?.message ?? 'Admin API error');
  }

  return (json as { data: T }).data;
}

export interface AdminWord {
  id: number;
  word: string;
  meaning: string;
  context: string;
  category: 'isim' | 'sıfat' | 'fiil';
  is_active: number;
  created_at: string;
}

export interface AdminDailyEntry {
  id: number;
  date: string;
  word_id: number;
  word: string;
  meaning: string;
  category: 'isim' | 'sıfat' | 'fiil';
}

export interface ListWordsResult {
  words: AdminWord[];
  total: number;
}

export interface ImportResult {
  inserted: number;
  skipped: number;
}

export interface ListWordsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  active?: '0' | '1';
  length?: number;
  sort?: 'az' | 'id_desc';
}

export function listWords(secret: string, params: ListWordsParams = {}): Promise<ListWordsResult> {
  const q = new URLSearchParams();
  if (params.page) q.set('page', String(params.page));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.search) q.set('search', params.search);
  if (params.category) q.set('category', params.category);
  if (params.active !== undefined) q.set('active', params.active);
  if (params.length !== undefined) q.set('length', String(params.length));
  if (params.sort) q.set('sort', params.sort);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return adminRequest<ListWordsResult>(`/words${qs}`, secret);
}

export function createWord(
  secret: string,
  data: { word: string; meaning: string; context: string; category: string }
): Promise<AdminWord> {
  return adminRequest<AdminWord>('/words', secret, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateWord(
  secret: string,
  id: number,
  data: Partial<{ word: string; meaning: string; context: string; category: string }>
): Promise<AdminWord> {
  return adminRequest<AdminWord>(`/words/${id}`, secret, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function toggleWordActive(
  secret: string,
  id: number,
  is_active: boolean
): Promise<AdminWord> {
  return adminRequest<AdminWord>(`/words/${id}`, secret, {
    method: 'PATCH',
    body: JSON.stringify({ is_active }),
  });
}

export function listDailySchedule(
  secret: string,
  params: { from?: string; to?: string } = {}
): Promise<AdminDailyEntry[]> {
  const q = new URLSearchParams();
  if (params.from) q.set('from', params.from);
  if (params.to) q.set('to', params.to);
  const qs = q.toString() ? `?${q.toString()}` : '';
  return adminRequest<AdminDailyEntry[]>(`/daily${qs}`, secret);
}

export function scheduleDailyWord(
  secret: string,
  word_id: number,
  date: string
): Promise<{ id: number; word_id: number; date: string; word: string }> {
  return adminRequest('/daily', secret, {
    method: 'POST',
    body: JSON.stringify({ word_id, date }),
  });
}

export function removeDailyWord(secret: string, id: number): Promise<{ success: boolean }> {
  return adminRequest(`/daily/${id}`, secret, { method: 'DELETE' });
}

export function importWords(
  secret: string,
  words: { word: string; meaning: string; context: string; category: string }[]
): Promise<ImportResult> {
  return adminRequest<ImportResult>('/import', secret, {
    method: 'POST',
    body: JSON.stringify({ words }),
  });
}

// ── Word Lists ────────────────────────────────────────────────────────────────

export interface AdminWordList {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  wordLength: number;
  isPublic: boolean;
  createdAt: string;
  wordCount: number;
}

export function listWordLists(secret: string): Promise<{ lists: AdminWordList[] }> {
  return adminRequest<{ lists: AdminWordList[] }>('/lists', secret);
}

export function createWordList(
  secret: string,
  data: { slug: string; name: string; description?: string; word_length: number; is_public: boolean }
): Promise<AdminWordList> {
  return adminRequest<AdminWordList>('/lists', secret, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateWordList(
  secret: string,
  slug: string,
  data: { name?: string; description?: string | null; is_public?: boolean }
): Promise<AdminWordList> {
  return adminRequest<AdminWordList>(`/lists/${slug}`, secret, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteWordList(secret: string, slug: string): Promise<{ success: boolean }> {
  return adminRequest(`/lists/${slug}`, secret, { method: 'DELETE' });
}

export function getListWords(secret: string, slug: string): Promise<{ words: AdminWord[] }> {
  return adminRequest<{ words: AdminWord[] }>(`/lists/${slug}/words`, secret);
}

export function addWordToList(secret: string, slug: string, word_id: number): Promise<{ success: boolean }> {
  return adminRequest(`/lists/${slug}/words`, secret, {
    method: 'POST',
    body: JSON.stringify({ word_id }),
  });
}

export function removeWordFromList(secret: string, slug: string, wordId: number): Promise<{ success: boolean }> {
  return adminRequest(`/lists/${slug}/words/${wordId}`, secret, { method: 'DELETE' });
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export interface AdminStats {
  words: { total: number; active: number; inactive: number };
  daily: { today: string | null; scheduledNext30: number; unscheduledNext30: number };
  users: { total: number };
  games: { totalPlayed: number; playedToday: number };
}

export function getAdminStats(secret: string): Promise<AdminStats> {
  return adminRequest<AdminStats>('/stats', secret);
}

export function autoFillSchedule(
  secret: string,
  days = 30
): Promise<{ scheduled: number; skipped: number }> {
  return adminRequest<{ scheduled: number; skipped: number }>('/daily/auto-fill', secret, {
    method: 'POST',
    body: JSON.stringify({ days }),
  });
}

export interface WordStatRow {
  word: string;
  meaning: string;
  total_played: number;
  total_won: number;
  win_rate: number;
  avg_guesses: number | null;
}

export function getWordStats(secret: string, sort: 'played' | 'win_rate' = 'played'): Promise<WordStatRow[]> {
  return adminRequest<WordStatRow[]>(`/word-stats?sort=${sort}`, secret);
}

export interface AdminUserRow {
  id: number;
  username: string;
  email: string;
  created_at: string;
  total_played: number;
  total_won: number;
  last_played: string | null;
}

export function getAdminUsers(secret: string): Promise<AdminUserRow[]> {
  return adminRequest<AdminUserRow[]>('/users', secret);
}
