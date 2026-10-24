export type FeedbackKind = 'general' | 'word_report';
export type FeedbackAppPlatform = 'android' | 'web';
export type FeedbackGameMode = 'daily' | 'unlimited';

export interface FeedbackInput {
  readonly kind: FeedbackKind;
  readonly message: string;
  readonly contact?: string;
  readonly app_platform: FeedbackAppPlatform;
  readonly app_version?: string;
  readonly mode?: FeedbackGameMode | null;
  readonly word_length?: number;
  readonly puzzle_date?: string;
  readonly reported_word?: string;
}

export interface FeedbackResponse {
  readonly id: number;
  readonly status: string;
}

/**
 * The finished game's own data, read by GameOverCard ("Kelimeyi bildir", R6) and carried through
 * the `feedback` route so the player never retypes it (AE8).
 */
export interface FeedbackPrefill {
  readonly mode: FeedbackGameMode;
  readonly wordLength: number;
  readonly puzzleDate: string | null;
  readonly reportedWord: string;
}
