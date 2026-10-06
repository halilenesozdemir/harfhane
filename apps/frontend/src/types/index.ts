import type { WordEntry } from '@harfhane/shared';
export type { WordEntry } from '@harfhane/shared';
export type { TileStatus, TimeCountdown, LetterHint } from '@harfhane/shared';
import type { TileStatus, LetterHint } from '@harfhane/shared';

export interface SessionChallenge {
  won: number;
  target: number;
  completed: boolean;
  record: (didWin: boolean) => void;
}

// Game types
export type GameStatus = 'playing' | 'won' | 'lost';
export type GameMode = 'daily' | 'unlimited';
export type WordLength = 4 | 5 | 6;
export type Theme = 'light' | 'dark' | 'system';

// Game state
export interface GameState {
  guesses: string[];
  evaluations: TileStatus[][];
  currentGuess: string;
  gameStatus: GameStatus;
  keyboardStatus: Record<string, TileStatus>;
}

// Statistics
export interface DailyStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: number[];
  lastPlayedDate: string | null;
}

export interface UnlimitedStats {
  gamesPlayed: number;
  gamesWon: number;
  guessDistribution: number[];
}

// Theme context
export interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  systemTheme: 'light' | 'dark';
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
  isHighContrast: boolean;
  setTheme: (theme: Theme) => void;
  setHighContrast: (enabled: boolean) => void;
  toggleTheme: () => void;
  setSystemPreference: () => void;
}

// Component props
export interface HeaderProps {
  onTitleClick: () => void;
  onHelpClick: () => void;
  onStatsClick: () => void;
  onSettingsClick: () => void;
  modeLabel?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export interface TileProps {
  letter: string;
  status: TileStatus;
  isRevealing: boolean;
  revealDelay: number;
  isFilled: boolean;
  isHint?: boolean;
}

export interface KeyProps {
  keyValue: string;
  onClick: (key: string) => void;
  status?: TileStatus;
  isWide?: boolean;
}

export interface GameGridProps {
  guesses: string[];
  evaluations: TileStatus[][];
  currentGuess: string;
  isRevealing: boolean;
  shakeRow: boolean;
  gameStatus: GameStatus;
  wordLength: WordLength;
  hint?: LetterHint | null;
}

export interface KeyboardProps {
  onKeyPress: (key: string) => void;
  keyboardStatus: Record<string, TileStatus>;
}

export interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DailyStats | UnlimitedStats;
  lastGuessCount: number;
  gameStatus: GameStatus;
  isUnlimited: boolean;
}

export interface GameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameStatus: GameStatus;
  solution: string;
  solutionEntry?: WordEntry | null;
  guesses: string[];
  evaluations: TileStatus[][];
  gameNumber: number | string;
  stats: DailyStats | UnlimitedStats;
  isUnlimited: boolean;
  onPlayAgain: () => void;
  onGoHome: () => void;
  sessionChallenge?: SessionChallenge;
  challengeUrl?: string;
}

export interface HomePageProps {
  onSelectMode: (mode: GameMode, wordLength: WordLength) => void;
}

export interface UseGameStateReturn {
  guesses: string[];
  evaluations: TileStatus[][];
  currentGuess: string;
  gameStatus: 'playing' | 'won' | 'lost';
  keyboardStatus: Record<string, TileStatus>;
  solution: string;
  solutionEntry: WordEntry | null;
  gameNumber: number | string;
  stats: DailyStats | UnlimitedStats;
  isRevealing: boolean;
  isLoading: boolean;
  isError: boolean;
  shakeRow: boolean;
  message: string;
  hasSeenHelp: boolean;
  mode: GameMode;
  wordLength: WordLength;
  isUnlimited: boolean;
  addLetter: (letter: string) => void;
  removeLetter: () => void;
  submitGuess: () => void;
  setHasSeenHelp: (value: boolean) => void;
  startNewGame: () => void;
  wordId: number | null;
}

// PWA Types
declare global {
  interface WindowEventMap {
    'beforeinstallprompt': BeforeInstallPromptEvent;
  }
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}
