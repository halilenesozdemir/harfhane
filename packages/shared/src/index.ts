export * from './game';

export type WordCategory = 'isim' | 'sıfat' | 'fiil';

export interface WordEntry {
  word: string;
  meaning: string | null;
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
  wordId: number;
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

// Gamification
export interface Badge {
  slug: string;
  name: string;
  description: string;
  icon: string;
}

export interface XPBreakdown {
  base: number;
  guessBonus: number;
  streakBonus: number;
}

export interface GameXPResult {
  earned: number;
  total: number;
  level: number;
  levelUp: boolean;
  newBadges: Badge[];
  breakdown: XPBreakdown;
  freezeTokenEarned: boolean;
}

export interface XPProfile {
  totalXP: number;
  level: number;
  nextLevelXP: number;
  badges: Badge[];
}

export interface UnlimitedPersonalStats {
  gamesPlayed: number;
  gamesWon: number;
  guessDistribution: number[];
  avgGuesses: number;
  bestStreak: number;
}

export interface DuelPublic {
  id: number;
  wordId: number;
  myRole: 'challenger' | 'opponent';
  myGuesses: number;
  myWon: boolean;
  opponentGuesses: number | null;
  opponentWon: boolean | null;
  opponentFinished: boolean;
}
