export type WordCategory = 'isim' | 'sıfat' | 'fiil';

export interface WordEntry {
  word: string;
  meaning: string;
  context: string;
  category: WordCategory;
}

export interface WordData {
  dailyWords: WordEntry[];
  validWords: string[];
}

export interface DailyWordResponse {
  word: WordEntry;
  gameNumber: number;
  date: string;
}

export interface RandomWordResponse {
  word: WordEntry;
}

export interface ValidateWordResponse {
  isValid: boolean;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export interface WordList {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  wordLength: number;
  isPublic: boolean;
  hasDaily: boolean;
  createdAt: string;
  wordCount?: number;
}

export interface WordListResponse {
  list: WordList;
}

export interface WordListsResponse {
  lists: WordList[];
}
