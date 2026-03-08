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
