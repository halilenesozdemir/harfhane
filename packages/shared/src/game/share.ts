import type { TileStatus } from './types';

// Owner decision 2026-10-24 (docs/decisions/2026-10-24-share-format.md): an original share
// format with no positional emoji grid, replacing the Wordle-style 🟩🟨⬜ rows + "n/6" text.
const FILLED_BAR_CHAR = '▰';
const EMPTY_BAR_CHAR = '▱';
const PRESENT_MARKER = '✦';
const MAX_GUESSES = 6;
const DEFAULT_SHARE_URL = 'harfhane.app';
const HINT_USED_LABEL = 'İpucuyla';
const HINT_UNUSED_LABEL = 'İpucusuz';
const UNLIMITED_HEADER_LABEL = 'Sınırsız';

const TURKISH_MONTH_NAMES: readonly string[] = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

/** A Turkey-day date string (`YYYY-MM-DD`, see `getTodayString`). */
export type ShareMode = { readonly type: 'daily'; readonly date: string } | { readonly type: 'unlimited' };

export interface ShareTextOptions {
  shareUrl?: string | undefined;
  hintUsed?: boolean | undefined;
  // Daily streak (DailyStats.currentStreak); shown only when > 0 and mode is daily.
  streak?: number | undefined;
}

function formatDailyHeaderDate(turkeyDate: string): string {
  const [, monthStr, dayStr] = turkeyDate.split('-');
  const monthName = TURKISH_MONTH_NAMES[Number(monthStr) - 1] ?? '';
  const day = Number(dayStr);
  return `${day} ${monthName}`;
}

function buildHeaderLine(mode: ShareMode, wordLength: number): string {
  const modeLabel = mode.type === 'daily' ? formatDailyHeaderDate(mode.date) : UNLIMITED_HEADER_LABEL;
  return `Harfhane · ${modeLabel} · ${wordLength} harf`;
}

function buildResultLine(isWon: boolean, guessCount: number): string {
  return isWon ? `${guessCount}. tahminde buldum` : `Bulamadım (${MAX_GUESSES} tahmin)`;
}

function buildBarLine(row: TileStatus[]): string {
  const correctCount = row.filter((status) => status === 'correct').length;
  const presentCount = row.filter((status) => status === 'present').length;
  const bar = FILLED_BAR_CHAR.repeat(correctCount) + EMPTY_BAR_CHAR.repeat(row.length - correctCount);
  return presentCount > 0 ? `${bar} ${PRESENT_MARKER}${presentCount}` : bar;
}

interface ResolvedShareOptions {
  readonly shareUrl: string;
  readonly hintUsed: boolean;
  readonly streak: number;
}

function buildFooterLines(mode: ShareMode, options: ResolvedShareOptions): [string, string] {
  const hintLabel = options.hintUsed ? HINT_USED_LABEL : HINT_UNUSED_LABEL;
  const showsStreak = mode.type === 'daily' && options.streak > 0;
  const streakSuffix = showsStreak ? ` · Seri ${options.streak}` : '';
  return [`${hintLabel}${streakSuffix}`, options.shareUrl];
}

/**
 * Builds Harfhane's own share text (owner decision 2026-10-24): one progress bar per guess
 * (▰ = correct position, ▱ = the rest), a `✦N` marker only when N letters are present but
 * misplaced, and never a positional reveal of which letters those are.
 */
export const generateShareText = (
  guesses: string[],
  evaluations: TileStatus[][],
  wordLength: number,
  mode: ShareMode,
  isWon: boolean,
  options: ShareTextOptions = {}
): string => {
  const resolvedOptions: ResolvedShareOptions = {
    shareUrl: options.shareUrl ?? DEFAULT_SHARE_URL,
    hintUsed: options.hintUsed ?? false,
    streak: options.streak ?? 0,
  };

  const lines = [
    buildHeaderLine(mode, wordLength),
    buildResultLine(isWon, guesses.length),
    '',
    ...evaluations.map(buildBarLine),
    '',
    ...buildFooterLines(mode, resolvedOptions),
  ];

  return lines.join('\n');
};
