import type { WordEntry } from '@nurdle/shared';
export type { WordEntry, WordData } from '@nurdle/shared';

// Game types
export type GameStatus = 'playing' | 'won' | 'lost';
export type GameMode = 'daily' | 'unlimited';
export type TileStatus = 'correct' | 'present' | 'absent' | null;
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

// Time countdown
export interface TimeCountdown {
  hours: string;
  minutes: string;
  seconds: string;
}

// Theme context
export interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  systemTheme: 'light' | 'dark';
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
  setTheme: (theme: Theme) => void;
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
}

export interface HomePageProps {
  onSelectMode: (mode: GameMode) => void;
}

export interface GameProps {
  mode: GameMode;
  onGoHome: () => void;
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
