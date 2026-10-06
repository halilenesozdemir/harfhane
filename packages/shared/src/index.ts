export * from './game';

export type WordCategory = 'isim' | 'sıfat' | 'fiil';

export interface WordEntry {
  word: string;
  meaning: string | null;
  context: string;
  category: WordCategory;
}

export interface DailyWordResponse {
  word: WordEntry;
  gameNumber: number;
  date: string;
}

export interface RandomWordResponse {
  word: WordEntry;
  wordId: number;
}

export interface ValidateWordResponse {
  isValid: boolean;
}

export interface PlayableLengthsResponse {
  lengths: number[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
