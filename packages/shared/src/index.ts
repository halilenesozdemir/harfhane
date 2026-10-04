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

export interface WordList {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  wordLength: number;
  isPublic: boolean;
  hasDaily: boolean;
  ownerUserId: number | null;
  createdAt: string;
  wordCount?: number;
  likeCount?: number;
  commentCount?: number;
}

export interface WordListResponse {
  list: WordList;
}

export interface WordListsResponse {
  lists: WordList[];
}

// Self-serve list creation
export interface CreateListInput {
  name: string;
  description?: string;
  wordLength: number;
  isPublic: boolean;
  slug?: string;
  hasDaily?: boolean;
}

export interface AddWordsInput {
  words: Array<{ word: string; meaning?: string }>;
}

export interface AddWordsResult {
  added: number;
  skipped: number;
  errors: string[];
}

export interface UpdateListInput {
  name?: string;
  description?: string | null;
  isPublic?: boolean;
  hasDaily?: boolean;
}

// Social
export interface ListLikeResponse {
  liked: boolean;
  count: number;
}

export interface ListComment {
  id: number;
  content: string;
  username: string;
  createdAt: string;
}

export interface ListCommentsResponse {
  comments: ListComment[];
}

export interface AddCommentResponse {
  comment: ListComment;
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
